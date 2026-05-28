import { QueryOptions } from '../types/index.js';
import User from '../models/user.js';

class UserRepository {
  async create(userData) {
    return await User.create(userData);
  }

  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  async findById(id) {
    return await User.findById(id);
  }

  async updateLastLogin(id) {
    return await User.findByIdAndUpdate(id, { lastLogin: new Date() }, { new: true });
  }

  async findAll(filter: Record<string, any> = {}, options: QueryOptions = {}) {
    const { page = 1, limit = 100, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const items = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    return { items, total, page, limit };
  }

  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  }

  async setPassword(id, newPassword) {
    const user = await User.findById(id).select('+password');
    if (!user) return null;
    user.password = newPassword;
    await user.save(); // triggers the pre-save bcrypt hook
    return user;
  }
}

export default new UserRepository();
