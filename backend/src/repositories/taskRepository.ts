import { QueryOptions } from '../types/index.js';
import Task from '../models/task.js';

class TaskRepository {
  async create(taskData) {
    return await Task.create(taskData);
  }

  async findById(id) {
    return await Task.findById(id)
      .populate('project', 'name status')
      .populate('assignees', 'name email role avatar')
      .populate('watchers', 'name email role avatar')
      .populate('dependencies', 'title status dueDate')
      .populate('milestone', 'name dueDate status')
      .populate('createdBy', 'name email role');
  }

  async update(id, updateData) {
    return await Task.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('project', 'name status')
      .populate('assignees', 'name email role avatar')
      .populate('watchers', 'name email role avatar')
      .populate('dependencies', 'title status dueDate')
      .populate('milestone', 'name dueDate status')
      .populate('createdBy', 'name email role');
  }

  async delete(id) {
    return await Task.findByIdAndDelete(id);
  }

  async findAll(filter: Record<string, any> = {}, options: QueryOptions = {}) {
    const { page = 1, limit = 1000, sort = 'dueDate' } = options;
    const skip = (page - 1) * limit;

    const items = await Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('project', 'name status')
      .populate('milestone', 'name dueDate status')
      .populate('assignees', 'name email role avatar');

    const total = await Task.countDocuments(filter);

    return { items, total, page, limit };
  }
}

export default new TaskRepository();
