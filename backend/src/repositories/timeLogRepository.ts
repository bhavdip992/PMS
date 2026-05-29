import { QueryOptions } from '../types/index.js';
import TimeLog from '../models/timeLog.js';

class TimeLogRepository {
  async create(data) {
    return await TimeLog.create(data);
  }

  async findById(id) {
    return await TimeLog.findById(id)
      .populate('user', 'name email role avatar')
      .populate('task', 'title')
      .populate('subtask', 'title');
  }

  async findActiveTimer(userId) {
    // Active timer has startTime but no endTime
    return await TimeLog.findOne({ user: userId, endTime: { $exists: false } })
      .populate('user', 'name email role avatar')
      .populate('task', 'title')
      .populate('subtask', 'title');
  }

  async update(id, updateData) {
    return await TimeLog.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('user', 'name email role avatar')
      .populate('task', 'title')
      .populate('subtask', 'title');
  }

  async delete(id) {
    return await TimeLog.findByIdAndDelete(id);
  }

  async findAll(filter: Record<string, any> = {}, options: QueryOptions = {}) {
    const { page = 1, limit = 100, sort = '-startTime' } = options;
    const skip = (page - 1) * limit;

    const items = await TimeLog.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email role avatar')
      .populate('task', 'title project')
      .populate({
        path: 'subtask',
        select: 'title parentTask',
        populate: {
          path: 'parentTask',
          select: 'title project'
        }
      });

    const total = await TimeLog.countDocuments(filter);

    return { items, total, page, limit };
  }
}

export default new TimeLogRepository();
