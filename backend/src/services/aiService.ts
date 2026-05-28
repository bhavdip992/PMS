import OpenAI from 'openai';
import taskRepository from '../repositories/taskRepository.js';
import timeLogRepository from '../repositories/timeLogRepository.js';

let openaiClient = null;

const getOpenAIClient = () => {
  if (openaiClient) return openaiClient;
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
};

class AIService {
  async summarizeCommunication(text) {
    const openai = getOpenAIClient();
    
    if (!openai) {
      // Return high-quality mock response
      return `### AI Summary (Mock Mode)
- **Key Discussion**: The team aligned on project timeline deliverables and designer handoff details.
- **Action Items**:
  - UI designer to share Figma link by tomorrow morning.
  - Developer to review routing and database schemas.
  - QA to draft the initial automation checklist.`;
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant for a digital agency. Summarize the following communication details or meeting transcript into a concise bulleted list of key discussion points and action items using markdown.'
          },
          {
            role: 'user',
            content: text
          }
        ]
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error(`OpenAI error: ${err.message}`);
      throw new Error(`AI summarization failed: ${err.message}`);
    }
  }

  async generateTasksFromPrompt(prompt) {
    const openai = getOpenAIClient();

    if (!openai) {
      // Mock task generation
      return [
        { title: 'Setup Development Environment', description: 'Configure node workspace, configure dotenv file, and start server', estimatedHours: 2 },
        { title: 'Design Database Schemas', description: 'Define Mongoose schemas for User, Task, and TimeLogs', estimatedHours: 4 },
        { title: 'Create JWT Auth API', description: 'Implement register, login, refresh, and logout endpoints', estimatedHours: 6 }
      ];
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a technical project manager. Based on the user prompt describing a feature or requirements, generate a JSON array of tasks containing the fields: "title" (string), "description" (string), and "estimatedHours" (number).'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      });
      
      const parsed = JSON.parse(response.choices[0].message.content);
      // Ensure we extract an array
      if (Array.isArray(parsed.tasks)) return parsed.tasks;
      if (Array.isArray(parsed)) return parsed;
      return Object.values(parsed).find(val => Array.isArray(val)) || [];
    } catch (err) {
      console.error(`OpenAI error: ${err.message}`);
      throw new Error(`AI task generation failed: ${err.message}`);
    }
  }

  async synthesizeDailyStandup(userId, userName) {
    // 1. Fetch user tasks updated in the last 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { items: tasks } = await taskRepository.findAll({
      assignees: userId,
      updatedAt: { $gte: dayAgo }
    });

    const completed = tasks.filter(t => t.status === 'Done').map(t => t.title);
    const inProgress = tasks.filter(t => t.status === 'In Progress').map(t => t.title);
    const inReview = tasks.filter(t => t.status === 'In Review').map(t => t.title);

    // 2. Fetch recent time logs
    const { items: logs } = await timeLogRepository.findAll({
      user: userId,
      startTime: { $gte: dayAgo }
    });

    const timeSpent = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const formattedTime = (timeSpent / 60).toFixed(1);

    const inputDataText = `
User: ${userName}
Completed Tasks: ${completed.join(', ') || 'None'}
In-Progress Tasks: ${inProgress.join(', ') || 'None'}
In-Review Tasks: ${inReview.join(', ') || 'None'}
Total time logged today: ${formattedTime} hours
`;

    const openai = getOpenAIClient();

    if (!openai) {
      // Mock standup generator
      return `### Daily Standup - ${userName}
- **Completed Yesterday**: ${completed.join(', ') || 'Started working on backlog items.'}
- **Focusing on Today**: ${inProgress.concat(inReview).join(', ') || 'Working through assigned tickets.'}
- **Blocked**: No blockers reported.
- **Time Tracked**: Logged ${formattedTime} hours today.`;
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in Scrum/Agile workflows. Synthesize a professional Daily Standup status report based on the provided user activity logs (completed tasks, current works-in-progress, and tracked hours). Present in markdown format.'
          },
          {
            role: 'user',
            content: inputDataText
          }
        ]
      });
      return response.choices[0].message.content;
    } catch (err) {
      console.error(`OpenAI error: ${err.message}`);
      throw new Error(`AI standup synthesis failed: ${err.message}`);
    }
  }
}

export default new AIService();
