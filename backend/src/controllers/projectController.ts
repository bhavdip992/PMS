import projectService from '../services/projectService.js';

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body, req.user._id);
    res.status(201).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.id, req.user);
    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user?._id?.toString());
    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.id);
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const listProjects = async (req, res, next) => {
  try {
    const { items, total, page, limit } = await projectService.listProjects(req.query, req.user);
    res.status(200).json({
      status: 'success',
      results: items.length,
      total,
      page,
      limit,
      data: { projects: items }
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectStats = async (req, res, next) => {
  try {
    const stats = await projectService.getProjectStats();
    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};
