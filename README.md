# Explainify — GitHub Code Exploration with Role-Based AI Explanations

**Explainify** is a web-based SaaS application that integrates GitHub’s REST and Search APIs with OpenAI's GPT-3.5 Turbo to provide role-specific, natural language explanations of source code. The platform helps developers, interns, designers, and product managers navigate unfamiliar repositories more effectively by generating contextual, persona-aware insights.

## Features

- **GitHub User Search**  
  Search GitHub profiles using autocomplete powered by the `/search/users` endpoint with debounce functionality to minimise rate-limited API calls.

- **Repository Explorer with Pagination**  
  Display user repositories in a responsive 3x3 grid with metadata including language, stars, forks, and last update time.

- **Profile Summary Generator**  
  Fetch and summarise user `README.md` files (if present) using OpenAI to provide a quick overview of the developer's focus.

- **Interactive File Browser**  
  Navigate and view syntax-highlighted code files via GitHub’s raw content endpoints.

- **Role-Specific Code Explanation**  
  Choose between user roles such as Intern, New Grad, Senior Developer, PM, and Designer to receive AI-generated explanations tailored to the selected persona.

- **Context-Aware Chat Interface**  
  Ask follow-up questions about code, with preserved conversational memory per session to enable deeper understanding.

## Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/explainify.git
cd explainify
npm install
```


Create a .env.local file and add your API keys:

```bash
NEXT_PUBLIC_GITHUB_TOKEN=your_github_token
OPENAI_API_KEY=your_openai_key
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`in your browser to use the application.

## Project Structure
```bash
/app
  └── page.tsx                # Home page with GitHub search and repo list
  └── repo/[owner]/[repo]     # Dynamic repo view and AI chat interface

/api
  ├── explain.ts              # POST endpoint for GPT-3.5 explanation
  └── summary.ts              # POST endpoint for README summarisation

/components                  # UI components (Cards, Avatar, Chat, etc.)
/lib                         # Utility functions (e.g., debounce, prompts)
```

## Prompt Engineering & LLM Integration
Each user role maps to a different system prompt to guide OpenAI’s output:

```bash
const rolePrompt = {
  intern: 'Explain this code as if I just started programming...',
  pm: 'Describe the high-level goal and user experience...',
  senior: 'Explain system design, performance considerations, and edge cases...'
}
```
The message format sent to the OpenAI API:

```bash
[
  { "role": "system", "content": "<rolePrompt>" },
  { "role": "user", "content": "Here is the code:\n<code>\n\nQuestion: <question>" }
]

```
Chat history is maintained client-side per session for continuity.

## Technologies Used

- Next.js (App Router)
- TailwindCSS with ShadCN UI
- GitHub REST & Search APIs
- OpenAI GPT-3.5 Turbo
- React Syntax Highlighter
- lodash.debounce

## Future Improvements
- GitHub OAuth to support private repositories
- Persistent chat memory (local storage or backend)
- Advanced features like test generation and code similarity search
- Drag-and-drop file upload for instant explanation
- UI improvements for mobile and accessibility