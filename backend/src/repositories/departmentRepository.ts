import { QueryOptions } from '../types/index.js';
import Department from '../models/department.js';

class DepartmentRepository {
  async create(departmentData: any) {
    return await Department.create(departmentData);
  }

  async findById(id: string) {
    return await Department.findById(id)
      .populate('head', 'name email role avatar')
      .populate('members', 'name email role avatar');
  }

  async update(id: string, updateData: any) {
    return await Department.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('head', 'name email role avatar')
      .populate('members', 'name email role avatar');
  }

  async delete(id: string) {
    return await Department.findByIdAndDelete(id);
  }

  async findAll(filter: Record<string, any> = {}, options: QueryOptions = {}) {
    const { page = 1, limit = 1000, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const items = await Department.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('head', 'name email role avatar')
      .populate('members', 'name email role avatar');

    const total = await Department.countDocuments(filter);

    return { items, total, page, limit };
  }
}

export default new DepartmentRepository();
