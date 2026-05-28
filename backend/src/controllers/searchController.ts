import Project from '../models/project.js';
import Task from '../models/task.js';
import Communication from '../models/communication.js';

export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(200).json({
        status: 'success',
        data: { projects: [], tasks: [], communications: [] }
      });
    }

    const regex = new RegExp(q, 'i');

    const [projects, tasks, communications] = await Promise.all([
      Project.find({
        $or: [
          { name: regex },
          { description: regex },
          { 'client.name': regex },
          { 'client.company': regex }
        ]
      }).limit(10),

      Task.find({
        $or: [
          { title: regex },
          { description: regex },
          { tags: regex }
        ]
      }).limit(15).populate('project', 'name'),

      Communication.find({
        $or: [
          { title: regex },
          { details: regex },
          { summary: regex }
        ]
      }).limit(10).populate('project', 'name')
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        projects,
        tasks,
        communications
      }
    });
  } catch (error) {
    next(error);
  }
};
