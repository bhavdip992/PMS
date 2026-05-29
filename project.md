# esparkPM – Technical Specification & AI Onboarding Guide

Welcome to the **esparkPM** technical documentation. This guide is designed to onboard developers and AI agents, enabling them to understand the system's codebase, data models, AI integrations, design guidelines, and expansion patterns.

---

## 📂 Codebase Directory Structure

esparkPM is organized as a decoupled monorepo containing a TypeScript Node/Express backend and a Vite React frontend.

### 1. Backend Service Layer (`/backend`)
- **`src/server.ts`**: Express application entry point. Wire-up of CORS, Helmet, security middlewares, and socket connections.
- **`src/config/db.ts`**: Database connection handler.
- **`src/routes/`**: Registers application router mounts. Organized by feature (e.g. `aiRoutes.ts`, `projectRoutes.ts`, `taskRoutes.ts`).
- **`src/controllers/`**: Standard Express request-response handlers. Interacts directly with the services.
- **`src/services/`**: Encapsulates business logic. Does not directly handle HTTP requests.
- **`src/services/ai/`**: Holds core Gemini integration logic.
  - `geminiService.ts`: Entry client handling prompt compilation, exponential retries, mock fallbacks, and memory caches.
  - `prompts/`: Structured TypeScript template functions compiling prompts to enforce strict JSON schemas.
  - `helpers/cacheHelper.ts`: Simple in-memory Map-based cache with TTL values.
- **`src/repositories/`**: Decoupled Mongoose database query wrappers providing transactional interface queries.
- **`src/models/`**: Declares Mongoose documents/schemas.

### 2. Frontend client (`/frontend`)
- **`src/main.tsx`**: React bootstrap file.
- **`src/App.tsx`**: Dynamic react router definitions.
- **`src/components/`**: Shared layout containers (`DashboardLayout.tsx`), Rich Text editors, Markdown rendering helpers, modal wrappers.
- **`src/store/`**: Zustand storage nodes containing reactive business actions and state (e.g., auth, notification, timer log states).
- **`src/features/`**: Feature-grouped modules containing page templates:
  - `dashboard/`: Welcome grids, role-specific metrics, and standup/productivity cards.
  - `tasks/`: Kanban boards, subtask drawers, task detail pages.
  - `admin/`: User roles and permission configurations.
  - `vault/`: Credential manager.
  - `workload/`: Workload balance and tracking metrics.

---

## 🗄️ Database Schemas Outline

esparkPM utilizes MongoDB. Below are key schemas and their relationships:

| Model | Collection | Primary Attributes | Relations |
|---|---|---|---|
| **User** | `users` | `name`, `email`, `password`, `role` (Super Admin, Admin, Project Manager, Developer, Client) | — |
| **Project** | `projects` | `name`, `description`, `status` (Planning, Active, Completed, On Hold), `client` | `members` -> `User` refs |
| **Task** | `tasks` | `title`, `description`, `status` (Backlog, Todo, In Progress, In Review, Done), `priority` | `project` -> `Project`, `assignee` -> `User` |
| **Subtask** | `subtasks` | `title`, `isCompleted` | `parentTask` -> `Task` |
| **TimeLog** | `timelogs` | `duration` (mins), `startTime`, `endTime`, `description` | `task` -> `Task`, `user` -> `User` |
| **Communication** | `communications` | `type` (Email, Meeting, Internal), `title`, `details`, `summary` | `project` -> `Project`, `author` -> `User` |

---

## 🤖 Gemini AI Prompt & Integration Guidelines

All AI features use Google Gemini's **`gemini-2.5-flash`** model. For consistency, the following guidelines **must** be enforced:

1. **JSON Output Mode**: Always pass `{ responseMimeType: 'application/json' }` to the Gemini initialization config.
2. **Double-Fence Cleaning**: Clean prompt returns to strip markdown code blocks (e.g. ` ```json ` tags) before passing string variables to `JSON.parse`.
3. **Prompt Isolation**: Prompts must be saved in `backend/src/services/ai/prompts/` as structured templates.
4. **Mock Fallbacks**: If the Gemini SDK client fails to initialize (or missing `GEMINI_API_KEY`), the query must catch errors and return a mock schema matching the schema format of the prompt.

### Standard Mock Blueprint Example:
```typescript
try {
  if (!getGenAIClient()) return this.getMockResponse();
  return await this.generateContent(prompt, { isJson: true });
} catch (err) {
  return this.getMockResponse();
}
```

---

## 🎨 UI Guidelines & Token Styling

Frontend components are styled using Tailwind CSS and custom design tokens defined in `frontend/src/index.css`.

- **Colors**: Never use default Tailwind raw primary colors (like `bg-blue-500`). Use customized slate variables:
  - Surfaces: `bg-[hsl(var(--espark-surface))]`
  - Secondary Surfaces: `bg-[hsl(var(--espark-surface-2))]`
  - Borders: `border-[hsl(var(--espark-border))]`
  - Primary text: `text-[hsl(var(--espark-text))]`
  - Accents/Primary: `text-[hsl(var(--espark-primary))]`
- **Animations**: Subtle, micro-animations like transitions (`transition-all duration-200`) and scale on active buttons (`active:scale-95`) must be present.
- **Icons**: Utilize the `lucide-react` icon package exclusively.

---

## 🛠️ Step-by-Step Feature Expansion Walkthrough

Follow this recipe to add a new AI-powered workflow (e.g. *Code Risk Analyzer*):

### Step 1: Create the prompt template
Add `/backend/src/services/ai/prompts/codeRiskPrompt.ts`:
```typescript
export const codeRiskPrompt = (codeContext: string) => `
Analyze this code context for security risks. Return a JSON object with:
{
  "riskScore": number (0 to 100),
  "vulnerabilities": string[],
  "mitigationSteps": string[]
}
Code Context:
${codeContext}
`;
```

### Step 2: Bind logic into Gemini Service
In `backend/src/services/ai/geminiService.ts`:
```typescript
import { codeRiskPrompt } from './prompts/codeRiskPrompt.js';

class GeminiService {
  async analyzeCodeRisk(codeContext: string): Promise<any> {
    const prompt = codeRiskPrompt(codeContext);
    try {
      if (!getGenAIClient()) return { riskScore: 10, vulnerabilities: [], mitigationSteps: [] };
      return await this.generateContent(prompt, { isJson: true });
    } catch {
      return { riskScore: 10, vulnerabilities: [], mitigationSteps: [] };
    }
  }
}
```

### Step 3: Wire Route and Controller
In `backend/src/controllers/aiController.ts` and `backend/src/routes/aiRoutes.ts`:
```typescript
export const getCodeRisk = async (req: any, res: any, next: any) => {
  const { code } = req.body;
  const analysis = await geminiService.analyzeCodeRisk(code);
  res.status(200).json({ status: 'success', data: analysis });
};
// Route
router.post('/code-risk', getCodeRisk);
```

### Step 4: Add UI Interaction
Integrate the feature into the React view calling `api.post('/ai/code-risk', { code })` using state parameters and Tailwind container stylings.
