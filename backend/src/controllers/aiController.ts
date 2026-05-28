import geminiService from '../services/ai/geminiService.js';
import taskRepository from '../repositories/taskRepository.js';
import timeLogRepository from '../repositories/timeLogRepository.js';
import userRepository from '../repositories/userRepository.js';
import communicationRepository from '../repositories/communicationRepository.js';

export const summarizeCommunication = async (req: any, res: any, next: any) => {
  try {
    const { text, type } = req.body;
    if (!text) {
      return res.status(400).json({ status: 'fail', message: 'Text content is required' });
    }
    const summary = await geminiService.summarizeCommunication(type || 'Discussion Thread', text);
    res.status(200).json({
      status: 'success',
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyStandup = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user._id;
    const userName = req.user.name;

    // Fetch user tasks updated in the last 24 hours
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { items: tasks } = await taskRepository.findAll({
      assignees: userId,
      updatedAt: { $gte: dayAgo }
    });

    const completed = tasks.filter((t: any) => t.status === 'Done').map((t: any) => t.title);
    const inProgress = tasks.filter((t: any) => t.status === 'In Progress').map((t: any) => t.title);
    const inReview = tasks.filter((t: any) => t.status === 'In Review').map((t: any) => t.title);

    // Fetch blockers (tasks marked blocked or high priority)
    const blockers = tasks.filter((t: any) => t.priority === 'High' && t.status !== 'Done').map((t: any) => t.title);

    // Fetch time logs
    const { items: logs } = await timeLogRepository.findAll({
      user: userId,
      startTime: { $gte: dayAgo }
    });
    const totalTimeLogged = logs.reduce((sum: number, log: any) => sum + (log.duration || 0), 0);
    const sprintProgress = `Tracked ${totalTimeLogged} minute(s) in the last 24h across tasks.`;

    const standup = await geminiService.synthesizeDailyStandup(
      userName,
      completed,
      inProgress,
      inReview,
      blockers,
      sprintProgress
    );

    res.status(200).json({
      status: 'success',
      data: { standup }
    });
  } catch (error) {
    next(error);
  }
};

export const summarizeTask = async (req: any, res: any, next: any) => {
  try {
    const { taskId, title, description, requirements } = req.body;
    let finalTitle = title;
    let finalDesc = description;
    let finalReq = requirements;

    if (taskId) {
      const task = await taskRepository.findById(taskId);
      if (task) {
        finalTitle = task.title;
        finalDesc = task.description;
        finalReq = task.requirements || '';
      }
    }

    if (!finalTitle) {
      return res.status(400).json({ status: 'fail', message: 'Task Title or ID is required' });
    }

    const summary = await geminiService.summarizeTask(finalTitle, finalDesc || '', finalReq || '');
    res.status(200).json({
      status: 'success',
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductivityInsights = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.body;
    const filter: Record<string, any> = {};
    if (projectId) filter.project = projectId;

    // Fetch all tasks for context
    const { items: tasks } = await taskRepository.findAll(filter);
    // Fetch users/team members
    const { items: users } = await userRepository.findAll();
    // Fetch time logs
    const { items: timeLogs } = await timeLogRepository.findAll();

    const tasksData = tasks
      .slice(0, 50)
      .map((t: any) => `Task [${t._id}]: "${t.title}" (Status: ${t.status}, Priority: ${t.priority}, Due: ${t.dueDate || 'None'}, Assignees: ${t.assignees?.map((a: any) => a.name).join(', ') || 'Unassigned'})`)
      .join('\n');

    const teamData = users
      .map((u: any) => `User: "${u.name}" (Role: ${u.role})`)
      .join('\n');

    const timeLogsData = timeLogs
      .slice(0, 50)
      .map((l: any) => `Log: User "${l.user?.name || l.user}" worked on Task "${l.task?.title || l.task}" for ${l.duration || 0} minutes.`)
      .join('\n');

    const insights = await geminiService.getProductivityInsights(teamData, tasksData, timeLogsData);
    res.status(200).json({
      status: 'success',
      data: { insights }
    });
  } catch (error) {
    next(error);
  }
};

export const getSearchAssistant = async (req: any, res: any, next: any) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ status: 'fail', message: 'Search query is required' });
    }

    // Fetch tasks & recent communications for context dataset
    const { items: tasks } = await taskRepository.findAll();
    const { items: communications } = await communicationRepository.findAll({}, { limit: 20 });

    const contextDataset = [
      '=== TASKS LIST ===',
      ...tasks.slice(0, 30).map((t: any) => `Task ID: ${t._id}\nTitle: ${t.title}\nDescription: ${t.description}\nStatus: ${t.status}\nPriority: ${t.priority}\nDueDate: ${t.dueDate || 'N/A'}`),
      '\n=== RECENT DISCUSSIONS ===',
      ...communications.map((c: any) => `Discussion: ${c.title}\nContent: ${c.content}\nParticipants: ${c.participants?.map((p: any) => p.name).join(', ')}`)
    ].join('\n\n');

    const answer = await geminiService.getSearchAnswer(query, contextDataset);
    res.status(200).json({
      status: 'success',
      data: { answer }
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationAlerts = async (req: any, res: any, next: any) => {
  try {
    const { items: tasks } = await taskRepository.findAll();
    const { items: users } = await userRepository.findAll();

    const tasksData = tasks
      .slice(0, 30)
      .map((t: any) => `Task ID: ${t._id}, Title: "${t.title}", Status: "${t.status}", DueDate: "${t.dueDate || 'N/A'}", Priority: "${t.priority}"`)
      .join('\n');

    const teamWorkloadData = users
      .map((u: any) => `User "${u.name}" (ID: ${u._id}, Role: ${u.role})`)
      .join('\n');

    const alertsResult = await geminiService.getNotificationAlerts(tasksData, teamWorkloadData);
    const alerts = Array.isArray(alertsResult) ? alertsResult : (alertsResult.alerts || []);
    res.status(200).json({
      status: 'success',
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
};

export const getDevAssistant = async (req: any, res: any, next: any) => {
  try {
    const { requestType, codeContext, userInstruction } = req.body;
    if (!requestType || !userInstruction) {
      return res.status(400).json({ status: 'fail', message: 'requestType and userInstruction are required' });
    }

    const response = await geminiService.getDevAssistantResponse(requestType, codeContext || '', userInstruction);
    res.status(200).json({
      status: 'success',
      data: { response }
    });
  } catch (error) {
    next(error);
  }
};

// Legacy OpenAI helper placeholder matching previous router functions
export const generateTasks = async (req: any, res: any, next: any) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ status: 'fail', message: 'Prompt is required' });
    }
    const tasks = await geminiService.summarizeTask('Prompt Input', prompt, '');
    // Wrap to match expected return format
    res.status(200).json({
      status: 'success',
      data: {
        tasks: tasks.simplifiedRequirements.map((reqStr: string, idx: number) => ({
          title: reqStr.substring(0, 50),
          description: reqStr,
          estimatedHours: 2 + idx
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
