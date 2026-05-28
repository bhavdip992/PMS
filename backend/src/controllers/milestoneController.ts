import Milestone from '../models/milestone.js';

export const listMilestones = async (req, res, next) => {
  try {
    const filter: Record<string, any> = {};
    if (req.query.project as string) {
      filter.project = req.query.project as string;
    }
    const milestones = await Milestone.find(filter).sort({ dueDate: 1 });
    res.status(200).json({
      status: 'success',
      results: milestones.length,
      data: { milestones }
    });
  } catch (err) {
    next(err);
  }
};

export const createMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { milestone }
    });
  } catch (err) {
    next(err);
  }
};

export const updateMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!milestone) {
      return res.status(404).json({ status: 'fail', message: 'Milestone not found' });
    }
    res.status(200).json({
      status: 'success',
      data: { milestone }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findByIdAndDelete(req.params.id);
    if (!milestone) {
      return res.status(404).json({ status: 'fail', message: 'Milestone not found' });
    }
    res.status(200).json({
      status: 'success',
      message: 'Milestone deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
