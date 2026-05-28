import { QueryOptions } from '../types/index.js';
import Project from '../models/project.js';

class ProjectRepository {
  async create(projectData) {
    return await Project.create(projectData);
  }

  async findById(id) {
    return await Project.findById(id)
      .populate('assignees', 'name email role avatar')
      .populate('teams')
      .populate('createdBy', 'name email role');
  }

  async update(id, updateData) {
    return await Project.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('assignees', 'name email role avatar')
      .populate('teams')
      .populate('createdBy', 'name email role');
  }

  async delete(id) {
    return await Project.findByIdAndDelete(id);
  }

  async findAll(filter: Record<string, any> = {}, options: QueryOptions = {}) {
    const { page = 1, limit = 1000, sort = '-createdAt' } = options; // High limit by default or paginated
    const skip = (page - 1) * limit;

    const query = Project.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('assignees', 'name email role avatar')
      .populate('teams');

    const items = await query;
    const total = await Project.countDocuments(filter);

    return { items, total, page, limit };
  }

  async getStatistics() {
    // Quick projects aggregation status count
    return await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
  }
}

export default new ProjectRepository();
