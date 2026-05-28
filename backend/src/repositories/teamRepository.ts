import { QueryOptions } from '../types/index.js';
import Team from '../models/team.js';

class TeamRepository {
  async create(teamData) {
    return await Team.create(teamData);
  }

  async findById(id) {
    return await Team.findById(id)
      .populate('leader', 'name email role avatar')
      .populate('members', 'name email role avatar');
  }

  async update(id, updateData) {
    return await Team.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('leader', 'name email role avatar')
      .populate('members', 'name email role avatar');
  }

  async delete(id) {
    return await Team.findByIdAndDelete(id);
  }

  async findAll(filter: Record<string, any> = {}, options: QueryOptions = {}) {
    const { page = 1, limit = 1000, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const items = await Team.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('leader', 'name email role avatar')
      .populate('members', 'name email role avatar');

    const total = await Team.countDocuments(filter);

    return { items, total, page, limit };
  }
}

export default new TeamRepository();
