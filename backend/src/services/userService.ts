import userRepository from '../repositories/userRepository.js';
import { AppError } from '../utils/appError.js';
import Session from '../models/session.js';
import LoginHistory from '../models/loginHistory.js';
import emailService from './emailService.js';
import crypto from 'crypto';

class UserService {
  /**
   * List all users.
   */
  async listUsers() {
    const { items, total } = await userRepository.findAll();
    return { users: items, total };
  }

  /**
   * Create a new user (Super Admin only — generates temp password and sends welcome email).
   */
  async createUser(userData) {
    const { email, name } = userData;

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('A user with this email already exists', 400);
    }

    const tempPassword = userData.password || crypto.randomBytes(8).toString('hex');
    userData.password = tempPassword;

    const user = await userRepository.create(userData);

    try {
      await emailService.sendWelcomeEmail(user.email, user.name, tempPassword);
    } catch (emailErr) {
      console.error('Welcome email failed to send:', emailErr);
    }

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  /**
   * Update a user's profile fields (name, role, department, etc.).
   */
  async updateUser(userId, updateData) {
    // Never allow password updates through this method
    delete updateData.password;

    const user = await userRepository.updateById(userId, updateData);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  /**
   * Toggle a user's active status (activate / deactivate).
   */
  async toggleUserActive(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    user.isActive = !user.isActive;
    
    // Revoke all sessions if deactivated
    if (!user.isActive) {
      await Session.updateMany({ userId, isRevoked: false }, { isRevoked: true });
    }
    
    await user.save();
    return user;
  }

  /**
   * Reset a user's password.
   */
  async resetUserPassword(userId, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }
    const user = await userRepository.setPassword(userId, newPassword);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Revoke sessions upon password reset
    await Session.updateMany({ userId, isRevoked: false }, { isRevoked: true });
    
    return { message: 'Password reset successfully' };
  }

  /**
   * Delete a user permanently.
   */
  async deleteUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (user.role === 'Super Admin') {
      throw new AppError('Cannot delete a Super Admin account', 400);
    }
    await userRepository.deleteById(userId);
    
    // Revoke all sessions
    await Session.deleteMany({ userId });
    
    return { message: 'User deleted successfully' };
  }

  /**
   * Get sessions for a specific user.
   */
  async getUserSessions(userId) {
    return await Session.find({ userId }).sort('-lastActive');
  }

  /**
   * Get login history for a specific user.
   */
  async getLoginHistory(userId) {
    return await LoginHistory.find({ userId }).sort('-timestamp');
  }
}

export default new UserService();
