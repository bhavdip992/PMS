import projectRepository from '../repositories/projectRepository.js';
import notificationService from './notificationService.js';
import { AppError } from '../utils/appError.js';

class ProjectService {
  async createProject(projectData: any, userId: string) {
    const data = { ...projectData, createdBy: userId };
    const project = await projectRepository.create(data);

    // Notify assignees and members
    const recipients: string[] = [
      ...(projectData.assignees || []).map((id: any) => id.toString()),
      ...(projectData.members || []).map((id: any) => id.toString()),
    ];
    const superAdminIds = await notificationService.getSuperAdminIds();
    const all = [...new Set([...recipients, ...superAdminIds])];

    await notificationService.notifyMany(all, userId, {
      type: 'project:assigned',
      title: `Project Assigned: ${project.name}`,
      message: `You have been added to the project "${project.name}".`,
      link: `/projects/${project._id}`,
      entityType: 'project',
      entityId: project._id,
    });

    return project;
  }

  async getProject(id: string, user: any) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);

    if (user && !['Super Admin', 'Admin', 'Project Manager'].includes(user.role)) {
      const isCreator = (project.createdBy?._id || project.createdBy)?.toString() === user._id.toString();
      const isAssignee = project.assignees?.some((id: any) => (id._id || id).toString() === user._id.toString());
      const isMember = project.members?.some((id: any) => (id._id || id).toString() === user._id.toString());
      if (!isCreator && !isAssignee && !isMember) {
        throw new AppError('Access denied: You are not assigned to this project', 403);
      }
    }
    return project;
  }

  async updateProject(id: string, updateData: any, userId?: string) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);

    const prevStatus = project.status;
    const updated = await projectRepository.update(id, updateData);

    if (userId && updateData.status && updateData.status !== prevStatus) {
      const recipients: string[] = [
        ...(project.assignees || []).map((id: any) => (id._id || id).toString()),
        ...(project.members || []).map((id: any) => (id._id || id).toString()),
        project.createdBy?._id?.toString() || project.createdBy?.toString(),
      ].filter(Boolean) as string[];

      const superAdminIds = await notificationService.getSuperAdminIds();
      const all = [...new Set([...recipients, ...superAdminIds])];

      await notificationService.notifyMany(all, userId, {
        type: 'project:status_changed',
        title: `Project Status Updated: ${project.name}`,
        message: `Status changed from "${prevStatus}" → "${updateData.status}".`,
        link: `/projects/${id}`,
        entityType: 'project',
        entityId: project._id,
      });
    }

    return updated;
  }

  async deleteProject(id: string) {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404);
    await projectRepository.delete(id);
    return { message: 'Project successfully deleted' };
  }

  async listProjects(query: any, user: any) {
    const filter: Record<string, any> = {};

    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

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

    if (query.assignee) filter.assignees = query.assignee;

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
    const formattedStats = {
      Planning: 0, 'In Progress': 0, 'On Hold': 0,
      Review: 0, Completed: 0, Cancelled: 0
    };
    stats.forEach((stat: any) => {
      if (formattedStats[stat._id] !== undefined) {
        formattedStats[stat._id] = stat.count;
      }
    });
    return formattedStats;
  }
}

export default new ProjectService();
