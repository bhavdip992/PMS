import userRepository from '../repositories/userRepository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';
import Session from '../models/session.js';
import LoginHistory from '../models/loginHistory.js';
import emailService from './emailService.js';
import crypto from 'crypto';
import User from '../models/user.js';

class AuthService {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(userData) {
    const { email } = userData;
    
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    const newUser = await userRepository.create(userData);
    
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Create session in DB
    const hashedToken = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await Session.create({
      userId: newUser._id,
      refreshToken: hashedToken,
      expiresAt
    });

    // Exclude password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return { user: userResponse, accessToken, refreshToken };
  }

  async login(email, password, deviceInfo: any = {}, ipAddress = '', userAgent = '') {
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new AppError('Incorrect email or password', 401);
    }

    // Check lock
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      throw new AppError(`Your account is temporarily locked. Try again in ${remainingMinutes} minutes.`, 403);
    }

    const isMatch = await user.comparePassword(password, user.password);

    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour lock
      }
      await user.save();

      // Log failure
      await LoginHistory.create({
        userId: user._id,
        ipAddress,
        userAgent,
        device: deviceInfo.device || 'Desktop',
        browser: deviceInfo.browser || 'Unknown',
        os: deviceInfo.os || 'Unknown',
        status: 'failed',
        timestamp: new Date()
      });

      throw new AppError('Incorrect email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    // Reset lock
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Log success
    await LoginHistory.create({
      userId: user._id,
      ipAddress,
      userAgent,
      device: deviceInfo.device || 'Desktop',
      browser: deviceInfo.browser || 'Unknown',
      os: deviceInfo.os || 'Unknown',
      status: 'success',
      timestamp: new Date()
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create Session
    const hashedToken = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await Session.create({
      userId: user._id,
      refreshToken: hashedToken,
      ipAddress,
      userAgent,
      deviceInfo: `${deviceInfo.device || 'Desktop'} (${deviceInfo.browser || 'Unknown'} on ${deviceInfo.os || 'Unknown'})`,
      expiresAt
    });

    // Clean password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, accessToken, refreshToken };
  }

  async refresh(token, ipAddress = '', userAgent = '') {
    if (!token) {
      throw new AppError('Refresh token is required', 400);
    }

    try {
      const decoded = verifyRefreshToken(token);
      const hashedToken = this.hashToken(token);

      // Verify session exists in DB and is active
      const session = await Session.findOne({ refreshToken: hashedToken, isRevoked: false });
      if (!session || session.expiresAt < new Date()) {
        throw new AppError('Invalid or expired session', 401);
      }

      const user = await userRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new AppError('User no longer exists or is suspended', 401);
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      const newHashedToken = this.hashToken(newRefreshToken);

      // Rotate session token
      session.refreshToken = newHashedToken;
      session.lastActive = new Date();
      session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      if (ipAddress) session.ipAddress = ipAddress;
      if (userAgent) session.userAgent = userAgent;
      await session.save();

      return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async logout(token) {
    if (!token) return;
    const hashedToken = this.hashToken(token);
    await Session.findOneAndUpdate({ refreshToken: hashedToken }, { isRevoked: true });
  }

  async logoutAll(userId) {
    await Session.updateMany({ userId, isRevoked: false }, { isRevoked: true });
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('There is no user with that email address.', 404);
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new AppError('There was an error sending the email. Try again later!', 500);
    }
  }

  async resetPassword(token, password) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new AppError('Token is invalid or has expired', 400);
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    // Revoke all sessions on password change
    await this.logoutAll(user._id);
  }

  async getActiveSessions(userId) {
    return await Session.find({ userId, isRevoked: false, expiresAt: { $gt: new Date() } })
      .sort('-lastActive');
  }

  async revokeSession(userId, sessionId) {
    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) {
      throw new AppError('Session not found', 404);
    }
    session.isRevoked = true;
    await session.save();
  }
}

export default new AuthService();
