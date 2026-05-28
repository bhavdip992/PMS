export const standupPrompt = (userName: string, completed: string[], inProgress: string[], inReview: string[], blockers: string[], sprintProgress: string) => {
  return `You are an expert Scrum Master / Agile Project Manager.
Synthesize a professional daily standup report for the developer: ${userName}.

Use the following input details:
- Completed Tasks: ${completed.length > 0 ? completed.join(', ') : 'None'}
- In Progress Tasks: ${inProgress.length > 0 ? inProgress.join(', ') : 'None'}
- In Review Tasks: ${inReview.length > 0 ? inReview.join(', ') : 'None'}
- Reported Blockers: ${blockers.length > 0 ? blockers.join(', ') : 'None'}
- Current Sprint Progress context: ${sprintProgress || 'Not specified'}

Provide a structured, clean daily standup response in JSON format. The response must be a single JSON object with EXACTLY the following structure (do not include any markdown fences or formatting other than raw JSON):
{
  "summary": "Brief high-level overview of developer output (1-2 sentences).",
  "updates": {
    "completed": ["Bullet points of what was done"],
    "todayFocus": ["Bullet points of what will be focused on today"],
    "reviewing": ["Bullet points of tasks currently in review"]
  },
  "blockersSummary": "Detailed summary of blockers and recommendations on how to unblock them.",
  "sprintStatus": "Brief assessment of how this developer's progress impacts overall sprint timeline."
}
`;
};
