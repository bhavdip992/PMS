import { QueryOptions } from '../types/index.js';
import Subtask from '../models/subtask.js';

class SubtaskRepository {
  async create(subtaskData) {
    return await Subtask.create(subtaskData);
  }

  async findById(id) {
    return await Subtask.findById(id).populate('assignee', 'name email role avatar');
  }

  async update(id, updateData) {
    return await Subtask.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('assignee', 'name email role avatar');
  }

  async delete(id) {
    return await Subtask.findByIdAndDelete(id);
  }

  async findAllByParentTask(parentTaskId) {
    return await Subtask.find({ parentTask: parentTaskId }).populate('assignee', 'name email role avatar');
  }

  async findAll(filter: Record<string, any> = {}) {
    return await Subtask.find(filter)
      .populate('assignee', 'name email role avatar')
      .populate({
        path: 'parentTask',
        select: 'title status project',
        populate: {
          path: 'project',
          select: 'name'
        }
      });
  }
}

export default new SubtaskRepository();
