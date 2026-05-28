export const taskSummaryPrompt = (taskTitle: string, description: string, requirements: string) => {
  return `You are an expert Principal Software Engineer.
Your task is to summarize a development task, simplify its requirements, extract edge cases, and generate acceptance criteria.

Task Details:
- Title: ${taskTitle}
- Description: ${description || 'No description provided'}
- Requirements Context: ${requirements || 'No specific requirements list'}

Provide a structured, clean response in JSON format. The response must be a single JSON object with EXACTLY the following structure (do not include any markdown fences or formatting other than raw JSON):
{
  "summary": "Concise technical summary (1-2 sentences) explaining the goal of the task.",
  "simplifiedRequirements": ["Array of simplified, plain-English bullet points of requirements"],
  "technicalExplanation": "A brief explanation of how a developer should approach this task technically (e.g., packages, database changes, endpoint designs).",
  "edgeCases": ["Bullet points of critical edge cases to verify during development/QA"],
  "acceptanceCriteria": ["Array of clear, testable acceptance criteria (Gherkin Given-When-Then or clear bullet points)"]
}
`;
};
