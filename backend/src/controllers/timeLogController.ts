import timeLogService from '../services/timeLogService.js';

export const startTimer = async (req, res, next) => {
  try {
    const { taskId, description, isBillable } = req.body;
    const log = await timeLogService.startTimer(req.user._id, taskId, description, isBillable);
    res.status(201).json({
      status: 'success',
      data: { timeLog: log }
    });
  } catch (error) {
    next(error);
  }
};

export const stopTimer = async (req, res, next) => {
  try {
    const log = await timeLogService.stopTimer(req.user._id);
    res.status(200).json({
      status: 'success',
      data: { timeLog: log }
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveTimer = async (req, res, next) => {
  try {
    const log = await timeLogService.getActiveTimer(req.user._id);
    res.status(200).json({
      status: 'success',
      data: { activeTimer: log }
    });
  } catch (error) {
    next(error);
  }
};

export const logTimeManual = async (req, res, next) => {
  try {
    const log = await timeLogService.logTimeManual(req.user._id, req.body);
    res.status(201).json({
      status: 'success',
      data: { timeLog: log }
    });
  } catch (error) {
    next(error);
  }
};

export const listTimeLogs = async (req, res, next) => {
  try {
    const { items, total, page, limit } = await timeLogService.listTimeLogs(req.query, req.user._id);
    res.status(200).json({
      status: 'success',
      results: items.length,
      total,
      page,
      limit,
      data: { timeLogs: items }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTimeLog = async (req, res, next) => {
  try {
    await timeLogService.deleteTimeLog(req.params.id, req.user._id);
    res.status(200).json({
      status: 'success',
      message: 'Time log deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskTimeLogs = async (req, res, next) => {
  try {
    const { items, total, page, limit } = await timeLogService.listTimeLogs(
      { task: req.params.id, all: true },
      req.user._id
    );
    res.status(200).json({
      status: 'success',
      results: items.length,
      total,
      page,
      limit,
      data: { timeLogs: items }
    });
  } catch (error) {
    next(error);
  }
};
