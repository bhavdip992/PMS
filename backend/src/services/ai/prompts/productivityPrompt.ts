export const productivityPrompt = (teamData: string, tasksData: string, timeLogsData: string) => {
  return `You are an expert Agile Coach and Productivity Analyst.
Analyze the following team performance metrics, tasks status, and time logs to generate productivity insights, identify delays, and perform risk analysis.

Workplace Team & Members:
${teamData}

Tasks Dataset:
${tasksData}

Tracked Time Logs:
${timeLogsData}

Provide a structured, clean response in JSON format. The response must be a single JSON object with EXACTLY the following structure (do not include any markdown fences or formatting other than raw JSON):
{
  "performanceScore": 85, // Integer scale 0-100 indicating sprint progress health
  "productivitySummary": "General summary of team productivity and current velocity (2-3 sentences).",
  "delayedTaskAnalysis": [
    {
      "taskId": "Task ID",
      "title": "Task title",
      "reasonForDelay": "Why is it delayed? (e.g., in review too long, high complexity, blocked)",
      "impact": "Impact on sprint/project timeline"
    }
  ],
  "workloadInsights": [
    {
      "userName": "Member Name",
      "loadAssessment": "High/Balanced/Low",
      "trackedHours": 40.5,
      "details": "Explanation of work balance"
    }
  ],
  "risks": [
    {
      "severity": "Low/Medium/High",
      "description": "Specific timeline or bottleneck risk",
      "mitigation": "Recommended action to resolve"
    }
  ]
}
`;
};
