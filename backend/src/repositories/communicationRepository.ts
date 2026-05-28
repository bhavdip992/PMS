import { QueryOptions } from '../types/index.js';
import Communication from '../models/communication.js';

class CommunicationRepository {
  async create(data) {
    return await Communication.create(data);
  }

  async findById(id) {
    return await Communication.findById(id)
      .populate('project', 'name')
      .populate('task', 'title')
      .populate('participants', 'name email role avatar')
      .populate('createdBy', 'name email role');
  }

  async findAll(filter: Record<string, any> = {}, options: QueryOptions = {}) {
    const { page = 1, limit = 10, sort = '-date' } = options;
    const skip = (page - 1) * limit;

    const items = await Communication.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('project', 'name')
      .populate('participants', 'name email role avatar')
      .populate('createdBy', 'name email role');

    const total = await Communication.countDocuments(filter);

    return { items, total, page, limit };
  }

  async delete(id) {
    return await Communication.findByIdAndDelete(id);
  }
}

export default new CommunicationRepository();
