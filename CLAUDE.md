# AI Assistant Usage Guide

> **Purpose**: This file documents how AI assistant is used in this project, including workflows, preferences, and integration patterns. This helps maintain consistency across development sessions and serves as a reference for team members.

## 📋 Quick Reference

### Project Context

- **Project Type**: Enterprise Content Management System (CMS) application for Enonic XP platform
- **Architecture**: Gradle multiproject combining modern frontend technologies with Java backend services
- **Tech Stack**: Preact 10, TypeScript, Webpack, Vite, Tailwind CSS, Java, Gradle, pnpm
- **Module Structure**:
  - `app` - Main Content Studio UI application
  - `lib` - Shared component library and utilities
  - `rest` - Backend REST API services (Java)
  - `testing` - End-to-end testing suite with WebDriver
- **Build System**: Gradle multiproject with pnpm workspaces for frontend dependencies
- **Code Organization**: React-like components with TypeScript, shared component library, RESTful APIs

### AI Assistant Role

- Code review and optimization suggestions
- Documentation generation and maintenance
- Debugging assistance and error analysis
- Architecture design discussions
- Test case generation
- UI design and development suggestions

## 🔧 Cursor IDE Integration

### .cursor/ Directory Structure

```
.cursor/
├── docs/              # Project documentation for AI context
├── rules/             # Coding standards and conventions
└── prompts/           # Reusable prompt templates
```

### Usage Instructions

1. **Context Loading**: Agent automatically reads `.cursor/docs/` for project context
2. **Rule Enforcement**: Coding standards from `.cursor/rules/` are applied during code reviews
3. **Prompt Templates**: Use `.cursor/prompts/` for consistent interaction patterns

## 📖 External Documentation (Context7 MCP)

Use the Context7 MCP server to fetch the latest, authoritative docs for external libraries whenever it is available.

### How to use

- Resolve the library ID first (exact name where possible), then request focused topics.
- Prefer narrow topics (e.g., "hooks", "dark mode", "library mode") over whole manuals.
- Keep token budgets conservative; summarize and cite instead of pasting long excerpts.
- If the server is unavailable, fall back to local docs or trusted sources.

### Typical libraries for this repo

- Preact: core APIs, hooks, context, refs
- Tailwind CSS v4: config/preset, plugins, theming, `data-theme` dark mode
- Vite: CSS bundling
- Webpack: Library mode, asset bundling
- Enonic UI: React components, Tailwind CSS v4, Lucide icons

### Retrieval guidance

- Choose the most authoritative match if multiple libraries resolve.
- Request specific topics; avoid multi-topic queries.
- Align results and recommendations with our stack and constraints.

### Output expectations

- Quote minimally; include the source and provide actionable guidance.
- Do not dump large doc blocks; provide links or identifiers when helpful.

## 🎯 Development Workflows

### Code Review Process

```markdown
# When requesting code review:

1. Provide the file path and function/component name
2. Include any specific concerns or requirements
3. Reference relevant architecture decisions from .cursor/docs/
4. Ask for suggestions based on .cursor/rules/ standards

Example: "Review the Button.ts component state logic, focusing on accessibility best practices."
```

### Debugging Workflow

```markdown
# When debugging:

1. Share error logs with context
2. Provide relevant code snippets
3. Include steps to reproduce
4. Reference similar issues from project history

Example: "Getting error during component rendering. Here's the stack trace ..."
```

### Documentation Generation

```markdown
# For documentation tasks:

1. Specify target audience (developers, users, designers)
2. Include existing doc structure for consistency
3. Reference .cursor/docs/ for context and standards
4. Request specific formats (JSDoc, README, API docs)
```

## 📝 Coding Preferences & Standards

### Code Style

- **Language**: TypeScript preferred, JavaScript when necessary. See `tsconfig.json` for details
- **Formatting**: Prettier with 2-space indentation. See `.prettierrc` for details
- **Linting**: ESLint default config + custom rules. See `eslint.config.js` for details
- **Comments**: JSDoc for public APIs, inline for complex logic

### Architecture Patterns

- **Frontend**: Component composition, custom hooks, context for state
- **Testing**: Jest + React Testing Library, integration tests for APIs

### Error Handling

Refer to rules under `.cursor/rules/`.

## 🚀 Deployment & DevOps

### CI/CD Pipeline

1. **Lint & Test**: ESLint, TypeScript check
2. **Build**: Gradle with Webpack & Vite build

## 📋 Project-Specific Context

### Business Logic Rules

- Minimal inner logic, focus on UI and styles

### Technical Constraints

- Support ECMAScript 2022
