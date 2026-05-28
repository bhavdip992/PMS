import projectRepository from '../repositories/projectRepository.js';
import { AppError } from '../utils/appError.js';

class ProjectService {
  async createProject(projectData, userId) {
    const data = {
      ...projectData,
      createdBy: userId
    };
    return await projectRepository.create(data);
  }

  async getProject(id, user) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    if (user && !['Super Admin', 'Admin', 'Project Manager'].includes(user.role)) {
      const isCreator = (project.createdBy?._id || project.createdBy)?.toString() === user._id.toString();
      const isAssignee = project.assignees?.some(id => (id._id || id).toString() === user._id.toString());
      const isMember = project.members?.some(id => (id._id || id).toString() === user._id.toString());
      if (!isCreator && !isAssignee && !isMember) {
        throw new AppError('Access denied: You are not assigned to this project', 403);
      }
    }
    return project;
  }

  async updateProject(id, updateData) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    return await projectRepository.update(id, updateData);
  }

  async deleteProject(id) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    await projectRepository.delete(id);
    return { message: 'Project successfully deleted' };
  }

  async listProjects(query, user) {
    const filter: Record<string, any> = {};
    
    // Status filter
    if (query.status) {
      filter.status = query.status;
    }

    // Priority filter
    if (query.priority) {
      filter.priority = query.priority;
    }

    // Search query by project name or client name
    let searchFilter = null;
    if (query.search) {
      searchFilter = {
        $or: [
          { name: { $regex: query.search, $options: 'i' } },
          { 'client.name': { $regex: query.search, $options: 'i' } },
          { 'client.company': { $regex: query.search, $options: 'i' } }
        ]
      };
    }

    // Assignee filter
    if (query.assignee) {
      filter.assignees = query.assignee;
    }

    // Role-based visibility restriction
    let roleFilter = null;
    if (user && !['Super Admin', 'Admin', 'Project Manager'].includes(user.role)) {
      roleFilter = {
        $or: [
          { assignees: user._id },
          { members: user._id },
          { createdBy: user._id }
        ]
      };
    }

    // Combine filters safely using $and if both search and role filters exist
    if (searchFilter && roleFilter) {
      filter.$and = [searchFilter, roleFilter];
    } else if (searchFilter) {
      filter.$or = searchFilter.$or;
    } else if (roleFilter) {
      filter.$or = roleFilter.$or;
    }

    const options = {
      page: parseInt(query.page, 10) || 1,
      limit: parseInt(query.limit, 10) || 10,
      sort: query.sort || '-createdAt'
    };

    return await projectRepository.findAll(filter, options);
  }

  async getProjectStats() {
    const stats = await projectRepository.getStatistics();
    
    // Transform formatting for charts
    const formattedStats = {
      Planning: 0,
      'In Progress': 0,
      'On Hold': 0,
      Review: 0,
      Completed: 0,
      Cancelled: 0
    };

    stats.forEach(stat => {
      if (formattedStats[stat._id] !== undefined) {
        formattedStats[stat._id] = stat.count;
      }
    });

    return formattedStats;
  }
}

export default new ProjectService();
