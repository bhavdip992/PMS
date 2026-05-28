export const searchPrompt = (query: string, contextDataset: string) => {
  return `You are an intelligent project assistant. Your task is to analyze the following PMS dataset (tasks, comments, status changes) and answer the user's semantic search query.

User Query: "${query}"

Dataset Context:
${contextDataset}

Provide a structured response in JSON format. The response must be a single JSON object with EXACTLY the following structure (do not include any markdown fences or formatting other than raw JSON):
{
  "directAnswer": "A comprehensive answer addressing the user's search query based purely on the dataset provided.",
  "matchedItemIds": ["Array of task or document IDs referenced in the answer"],
  "confidenceScore": 92, // Integer scale 0-100 indicating search result confidence
  "suggestedFollowUpQueries": ["Array of follow-up questions the user might ask next"]
}
`;
};
