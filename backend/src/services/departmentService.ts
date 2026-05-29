import departmentRepository from '../repositories/departmentRepository.js';
import { AppError } from '../utils/appError.js';

class DepartmentService {
  async createDepartment(departmentData: any) {
    if (!departmentData.members) departmentData.members = [];
    if (departmentData.head && !departmentData.members.includes(departmentData.head)) {
      departmentData.members.push(departmentData.head);
    }
    // Automatically generate slug from name
    if (departmentData.name && !departmentData.slug) {
      departmentData.slug = departmentData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    return await departmentRepository.create(departmentData);
  }

  async getDepartment(id: string) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    return department;
  }

  async updateDepartment(id: string, updateData: any) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    return await departmentRepository.update(id, updateData);
  }

  async deleteDepartment(id: string) {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw new AppError('Department not found', 404);
    }
    await departmentRepository.delete(id);
    return { message: 'Department successfully deleted' };
  }

  async listDepartments() {
    return await departmentRepository.findAll();
  }
}

export default new DepartmentService();
