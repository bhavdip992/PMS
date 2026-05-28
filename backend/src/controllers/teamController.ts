import teamService from '../services/teamService.js';

export const createTeam = async (req, res, next) => {
  try {
    const team = await teamService.createTeam(req.body, req.user._id);
    res.status(201).json({
      status: 'success',
      data: { team }
    });
  } catch (error) {
    next(error);
  }
};

export const getTeam = async (req, res, next) => {
  try {
    const team = await teamService.getTeam(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { team }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    const team = await teamService.updateTeam(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      data: { team }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const result = await teamService.deleteTeam(req.params.id);
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const team = await teamService.addMember(req.params.id, req.body.memberId);
    res.status(200).json({
      status: 'success',
      data: { team }
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const team = await teamService.removeMember(req.params.id, req.body.memberId);
    res.status(200).json({
      status: 'success',
      data: { team }
    });
  } catch (error) {
    next(error);
  }
};

export const listTeams = async (req, res, next) => {
  try {
    const { items, total } = await teamService.listTeams();
    res.status(200).json({
      status: 'success',
      results: items.length,
      total,
      data: { teams: items }
    });
  } catch (error) {
    next(error);
  }
};
