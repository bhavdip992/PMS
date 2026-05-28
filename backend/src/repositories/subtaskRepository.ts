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
}

export default new SubtaskRepository();
