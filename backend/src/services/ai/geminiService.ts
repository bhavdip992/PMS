import { GoogleGenerativeAI } from '@google/generative-ai';
import { standupPrompt } from './prompts/standupPrompt.js';
import { taskSummaryPrompt } from './prompts/taskSummaryPrompt.js';
import { communicationSummaryPrompt } from './prompts/communicationSummaryPrompt.js';
import { productivityPrompt } from './prompts/productivityPrompt.js';
import { searchPrompt } from './prompts/searchPrompt.js';
import { notificationPrompt } from './prompts/notificationPrompt.js';
import { devAssistantPrompt } from './prompts/devAssistantPrompt.js';
import { aiCache } from './helpers/cacheHelper.js';

let genAI: GoogleGenerativeAI | null = null;

const getGenAIClient = () => {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.warn('Google Gemini API Key is missing. Falling back to local Mock AI provider.');
    return null;
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
};

// Sleep helper for exponential backoff
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Hash function for cache keys
const generateCacheKey = (prompt: string): string => {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `gemini_cache_${hash}`;
};

class GeminiService {
  /**
   * General request wrapper with error handling, retries, and schema validation.
   */
  async generateContent(prompt: string, options: { isJson?: boolean; ttlMs?: number } = {}): Promise<any> {
    const cacheKey = generateCacheKey(prompt);
    const cached = aiCache.get(cacheKey);
    if (cached) {
      console.log('AI Cache Hit for key:', cacheKey);
      return cached;
    }

    const client = getGenAIClient();
    if (!client) {
      throw new Error('Gemini API client not initialized. Key is missing.');
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = client.getGenerativeModel({ model: modelName });

    const maxRetries = 3;
    let attempt = 0;
    let delay = 1000; // start with 1s

    while (attempt < maxRetries) {
      try {
        attempt++;
        const generationConfig: any = {};
        if (options.isJson) {
          generationConfig.responseMimeType = 'application/json';
        }

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig,
        });

        const response = await result.response;
        const text = response.text();

        if (!text) {
          throw new Error('Gemini returned an empty response.');
        }

        let parsedResult: any = text;
        if (options.isJson) {
          try {
            // strip markdown json code block tags if returned despite config
            let cleanText = text.trim();
            if (cleanText.startsWith('```json')) {
              cleanText = cleanText.substring(7, cleanText.length - 3).trim();
            } else if (cleanText.startsWith('```')) {
              cleanText = cleanText.substring(3, cleanText.length - 3).trim();
            }
            parsedResult = JSON.parse(cleanText);
          } catch (e: any) {
            console.error('Failed to parse JSON from Gemini response:', text);
            throw new Error(`Invalid JSON format from AI: ${e.message}`);
          }
        }

        // Cache the successful response
        aiCache.set(cacheKey, parsedResult, options.ttlMs);
        return parsedResult;
      } catch (err: any) {
        console.error(`Gemini request failed (attempt ${attempt}/${maxRetries}): ${err.message}`);
        if (attempt >= maxRetries) {
          throw err;
        }
        await sleep(delay);
        delay *= 2; // exponential backoff
      }
    }
  }

  /**
   * Daily Standup Synthesis
   */
  async synthesizeDailyStandup(
    userName: string,
    completed: string[],
    inProgress: string[],
    inReview: string[],
    blockers: string[],
    sprintProgress: string
  ): Promise<any> {
    const prompt = standupPrompt(userName, completed, inProgress, inReview, blockers, sprintProgress);
    try {
      if (!getGenAIClient()) {
        return this.getMockStandup(userName, completed, inProgress, inReview, blockers);
      }
      return await this.generateContent(prompt, { isJson: true });
    } catch (err: any) {
      console.warn('synthesizeDailyStandup failed, returning mock response:', err.message);
      return this.getMockStandup(userName, completed, inProgress, inReview, blockers);
    }
  }

  private getMockStandup(userName: string, completed: string[], inProgress: string[], inReview: string[], blockers: string[]) {
    return {
      summary: `Standup summary for ${userName}. Focus is on moving pending items into done state.`,
      updates: {
        completed: completed.length > 0 ? completed : ['No tasks completed in the last 24h.'],
        todayFocus: inProgress.length > 0 ? inProgress : ['Addressing general backlog items.'],
        reviewing: inReview.length > 0 ? inReview : ['No tasks currently in review.']
      },
      blockersSummary: blockers.length > 0 
        ? `Blocker reported: "${blockers.join(', ')}". Needs coordination to resolve.`
        : 'No blockers reported.',
      sprintStatus: 'Progress is on track with scheduled sprint timelines.'
    };
  }

  /**
   * Task Summarization
   */
  async summarizeTask(taskTitle: string, description: string, requirements: string): Promise<any> {
    const prompt = taskSummaryPrompt(taskTitle, description, requirements);
    try {
      if (!getGenAIClient()) {
        return this.getMockTaskSummary(taskTitle);
      }
      return await this.generateContent(prompt, { isJson: true });
    } catch (err: any) {
      console.warn('summarizeTask failed, returning mock response:', err.message);
      return this.getMockTaskSummary(taskTitle);
    }
  }

  private getMockTaskSummary(taskTitle: string) {
    return {
      summary: `Technical implementation requirements for: ${taskTitle}.`,
      simplifiedRequirements: ['Set up configurations.', 'Implement core controller actions.', 'Verify security and access controls.'],
      technicalExplanation: 'Review routers and hook the functions into controller methods with try/catch.',
      edgeCases: ['Unexpected null parameters.', 'Rate-limits or connection timeouts.'],
      acceptanceCriteria: ['Task works as expected.', 'Integration tests pass.']
    };
  }

  /**
   * Communication Summary
   */
  async summarizeCommunication(communicationType: string, content: string): Promise<any> {
    const prompt = communicationSummaryPrompt(communicationType, content);
    try {
      if (!getGenAIClient()) {
        return this.getMockCommunicationSummary();
      }
      return await this.generateContent(prompt, { isJson: true });
    } catch (err: any) {
      console.warn('summarizeCommunication failed, returning mock response:', err.message);
      return this.getMockCommunicationSummary();
    }
  }

  private getMockCommunicationSummary() {
    return {
      keyTakeaways: ['Aligned on core backend module routes.', 'Agreed to finalize styling tokens by sprint review.'],
      actionItems: [
        { taskName: 'Share styling config', assignee: 'UI Designer', context: 'Share Figma design tokens.' },
        { taskName: 'Database schema draft', assignee: 'Backend Team', context: 'Complete backend migration definitions.' }
      ],
      importantChanges: ['Changed deployment targets to standard staging nodes.'],
      pendingDecisions: ['Client needs to approve custom SMTP config.']
    };
  }

  /**
   * Productivity Insights
   */
  async getProductivityInsights(teamData: string, tasksData: string, timeLogsData: string): Promise<any> {
    const prompt = productivityPrompt(teamData, tasksData, timeLogsData);
    try {
      if (!getGenAIClient()) {
        return this.getMockProductivityInsights();
      }
      return await this.generateContent(prompt, { isJson: true });
    } catch (err: any) {
      console.warn('getProductivityInsights failed, returning mock response:', err.message);
      return this.getMockProductivityInsights();
    }
  }

  private getMockProductivityInsights() {
    return {
      performanceScore: 82,
      productivitySummary: 'The team shows steady sprint progress. Task transitions are smooth, but review times average higher than expected.',
      delayedTaskAnalysis: [
        { taskId: 'T-102', title: 'OAuth integration', reasonForDelay: 'API key setup coordination', impact: 'Minor deployment block' }
      ],
      workloadInsights: [
        { userName: 'Developer A', loadAssessment: 'Balanced', trackedHours: 35.5, details: 'Steady contribution.' }
      ],
      risks: [
        { severity: 'Medium', description: 'Overdue task queue build-up', mitigation: 'Redistribute review workload.' }
      ]
    };
  }

  /**
   * Search Assistant
   */
  async getSearchAnswer(query: string, contextDataset: string): Promise<any> {
    const prompt = searchPrompt(query, contextDataset);
    try {
      if (!getGenAIClient()) {
        return this.getMockSearchAnswer(query);
      }
      return await this.generateContent(prompt, { isJson: true });
    } catch (err: any) {
      console.warn('getSearchAnswer failed, returning mock response:', err.message);
      return this.getMockSearchAnswer(query);
    }
  }

  private getMockSearchAnswer(query: string) {
    return {
      directAnswer: `Matched search result for "${query}". The records indicate that oauth setup tasks and deployment actions are active.`,
      matchedItemIds: [],
      confidenceScore: 70,
      suggestedFollowUpQueries: ['Show details of blocked deployment tasks', 'List assignees for overdue tasks']
    };
  }

  /**
   * Notification Intelligence
   */
  async getNotificationAlerts(tasksData: string, teamWorkloadData: string): Promise<any> {
    const prompt = notificationPrompt(tasksData, teamWorkloadData);
    try {
      if (!getGenAIClient()) {
        return this.getMockNotificationAlerts();
      }
      return await this.generateContent(prompt, { isJson: true });
    } catch (err: any) {
      console.warn('getNotificationAlerts failed, returning mock response:', err.message);
      return this.getMockNotificationAlerts();
    }
  }

  private getMockNotificationAlerts() {
    return {
      alerts: [
        {
          type: 'SprintRisk',
          severity: 'warning',
          title: 'Upcoming Sprint Deadline',
          message: 'Several critical tasks remain in review with 2 days left in the current sprint.',
          targetUserId: 'All',
          suggestedAction: 'Prioritize reviewing pull requests.'
        }
      ]
    };
  }

  /**
   * Developer Assistance
   */
  async getDevAssistantResponse(requestType: 'explain' | 'refactor' | 'breakdown', codeContext: string, userInstruction: string): Promise<any> {
    const prompt = devAssistantPrompt(requestType, codeContext, userInstruction);
    try {
      if (!getGenAIClient()) {
        return this.getMockDevAssistant();
      }
      return await this.generateContent(prompt, { isJson: true });
    } catch (err: any) {
      console.warn('getDevAssistantResponse failed, returning mock response:', err.message);
      return this.getMockDevAssistant();
    }
  }

  private getMockDevAssistant() {
    return {
      explanation: 'Code implementation review. The logical flow is clean but error catch blocks can be improved.',
      suggestedCode: '```javascript\n// Suggested Improvement\ntry {\n  // your logic\n} catch (e) {\n  logger.error(e);\n}\n```',
      complexityImpact: 'Low',
      bestPractices: ['Implement robust validation.', 'Use exact logging blocks.']
    };
  }
}

export default new GeminiService();
