export const communicationSummaryPrompt = (communicationType: string, content: string) => {
  return `You are a professional business analyst and communication manager.
Your task is to summarize a client discussion, meeting transcript, or internal comment thread and extract action items and pending decisions.

Communication Source Type: ${communicationType}
Content:
${content}

Provide a structured, clean response in JSON format. The response must be a single JSON object with EXACTLY the following structure (do not include any markdown fences or formatting other than raw JSON):
{
  "keyTakeaways": ["Array of critical discussion points and takeaways"],
  "actionItems": [
    {
      "taskName": "Action item task name",
      "assignee": "Person responsible (or 'Unassigned')",
      "context": "Context or details"
    }
  ],
  "importantChanges": ["Any specification changes, scope changes, or timeline modifications discussed"],
  "pendingDecisions": ["Decisions that still need to be made, questions raised, or feedback needed from client/management"]
}
`;
};
