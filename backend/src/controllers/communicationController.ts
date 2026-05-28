import communicationService from '../services/communicationService.js';

export const logCommunication = async (req, res, next) => {
  try {
    const log = await communicationService.logCommunication(req.body, req.user._id);
    res.status(201).json({
      status: 'success',
      data: { log }
    });
  } catch (error) {
    next(error);
  }
};

export const getCommunication = async (req, res, next) => {
  try {
    const log = await communicationService.getCommunication(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { log }
    });
  } catch (error) {
    next(error);
  }
};

export const listCommunications = async (req, res, next) => {
  try {
    const { items, total, page, limit } = await communicationService.listCommunications(req.query);
    res.status(200).json({
      status: 'success',
      results: items.length,
      total,
      page,
      limit,
      data: { communications: items }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCommunication = async (req, res, next) => {
  try {
    const result = await communicationService.deleteCommunication(req.params.id);
    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
