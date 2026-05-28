import AuditLog from '../models/auditLog.js';

export const listAuditLogs = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.severity) filter.severity = req.query.severity;

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort('-timestamp')
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: logs.length,
      total,
      data: { logs }
    });
  } catch (error) {
    next(error);
  }
};
