import subtaskService from '../services/subtaskService.js';
import commentService from '../services/commentService.js';

export const createSubtask = async (req, res, next) => {
  try {
    const subtaskData = { ...req.body };
    if (req.params.taskId) {
      subtaskData.parentTask = req.params.taskId;
    }
    const subtask = await subtaskService.createSubtask(subtaskData);
    res.status(201).json({
      status: 'success',
      data: { subtask }
    });
  } catch (error) {
    next(error);
  }
};

export const getSubtask = async (req, res, next) => {
  try {
    const subtask = await subtaskService.getSubtask(req.params.id, req.user);
    res.status(200).json({
      status: 'success',
      data: { subtask }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubtask = async (req, res, next) => {
  try {
    const subtask = await subtaskService.updateSubtask(req.params.id, req.body, req.user?._id?.toString());
    res.status(200).json({
      status: 'success',
      data: { subtask }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSubtask = async (req, res, next) => {
  try {
    const result = await subtaskService.deleteSubtask(req.params.id);
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const listSubtasks = async (req, res, next) => {
  try {
    const subtasks = await subtaskService.listSubtasksForTask(req.params.taskId);
    res.status(200).json({
      status: 'success',
      results: subtasks.length,
      data: { subtasks }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleSubtask = async (req, res, next) => {
  try {
    const subtask = await subtaskService.toggleSubtask(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { subtask }
    });
  } catch (error) {
    next(error);
  }
};

export const createSubtaskComment = async (req, res, next) => {
  try {
    const comment = await commentService.createSubtaskComment(req.params.id, req.body, req.user._id);
    res.status(201).json({
      status: 'success',
      data: { comment }
    });
  } catch (error) {
    next(error);
  }
};

export const getSubtaskComments = async (req, res, next) => {
  try {
    const comments = await commentService.getCommentsForSubtask(req.params.id);
    res.status(200).json({
      status: 'success',
      results: comments.length,
      data: { comments }
    });
  } catch (error) {
    next(error);
  }
};

export const listAllSubtasks = async (req, res, next) => {
  try {
    const filter: any = {};
    if (req.query.assignee) filter.assignee = req.query.assignee;
    if (req.query.parentTask) filter.parentTask = req.query.parentTask;
    if (req.query.status) filter.status = req.query.status;
    
    const subtasks = await subtaskService.listAllSubtasks(filter);
    res.status(200).json({
      status: 'success',
      results: subtasks.length,
      data: { subtasks }
    });
  } catch (error) {
    next(error);
  }
};
