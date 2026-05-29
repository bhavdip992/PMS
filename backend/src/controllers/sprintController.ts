import sprintService from '../services/sprintService.js';

export const getSprints = async (req: any, res: any, next: any) => {
  try {
    const sprints = await sprintService.getSprints(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { sprints }
    });
  } catch (error) {
    next(error);
  }
};

export const createSprint = async (req: any, res: any, next: any) => {
  try {
    const sprint = await sprintService.createSprint(req.params.id, req.body);
    res.status(201).json({
      status: 'success',
      data: { sprint }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSprint = async (req: any, res: any, next: any) => {
  try {
    const sprint = await sprintService.updateSprint(req.params.id, req.params.sprintId, req.body);
    res.status(200).json({
      status: 'success',
      data: { sprint }
    });
  } catch (error) {
    next(error);
  }
};

export const startSprint = async (req: any, res: any, next: any) => {
  try {
    const sprint = await sprintService.startSprint(req.params.id, req.params.sprintId);
    res.status(200).json({
      status: 'success',
      data: { sprint }
    });
  } catch (error) {
    next(error);
  }
};

export const completeSprint = async (req: any, res: any, next: any) => {
  try {
    const sprint = await sprintService.completeSprint(req.params.id, req.params.sprintId);
    res.status(200).json({
      status: 'success',
      data: { sprint }
    });
  } catch (error) {
    next(error);
  }
};

export const getTimeline = async (req: any, res: any, next: any) => {
  try {
    const timeline = await sprintService.getTimeline(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { timeline }
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req: any, res: any, next: any) => {
  try {
    const reports = await sprintService.getReports(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { reports }
    });
  } catch (error) {
    next(error);
  }
};

export const getSprintBurndown = async (req: any, res: any, next: any) => {
  try {
    const burndown = await sprintService.getSprintBurndown(req.params.id, req.params.sprintId);
    res.status(200).json({
      status: 'success',
      data: { burndown }
    });
  } catch (error) {
    next(error);
  }
};
