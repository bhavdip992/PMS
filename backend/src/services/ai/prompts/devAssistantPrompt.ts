export const devAssistantPrompt = (requestType: 'explain' | 'refactor' | 'breakdown', codeContext: string, userInstruction: string) => {
  return `You are an elite AI software developer assistant. Perform the requested developer task: ${requestType}.

User Instruction/Goal:
"${userInstruction}"

Code / Context:
${codeContext}

Provide a structured, clean response in JSON format. The response must be a single JSON object with EXACTLY the following structure (do not include any markdown fences or formatting other than raw JSON):
{
  "explanation": "Markdown description explaining the logic, the changes made, or the tech breakdown details.",
  "suggestedCode": "The complete suggested code block or task list in Markdown format.",
  "complexityImpact": "Low/Medium/High details regarding complexity or performance change.",
  "bestPractices": ["Bullet points of engineering principles applied or to consider"]
}
`;
};
