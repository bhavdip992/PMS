import taskService from '../services/taskService.js';

export const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body, req.user._id);
    res.status(201).json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTask(req.params.id, req.user);
    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body, req.user._id);
    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.id);
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const listTasks = async (req, res, next) => {
  try {
    const { items, total, page, limit } = await taskService.listTasks(req.query, req.user);
    res.status(200).json({
      status: 'success',
      results: items.length,
      total,
      page,
      limit,
      data: { tasks: items }
    });
  } catch (error) {
    next(error);
  }
};

// Checklist handlers
export const addChecklistItem = async (req, res, next) => {
  try {
    const { title } = req.body;
    const task = await taskService.addChecklistItem(req.params.id, title);
    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleChecklistItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const task = await taskService.toggleChecklistItem(req.params.id, itemId);
    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

export const removeChecklistItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const task = await taskService.removeChecklistItem(req.params.id, itemId);
    res.status(200).json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};
