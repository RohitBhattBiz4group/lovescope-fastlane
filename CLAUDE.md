# love-scope-app — React Native Rules
<!-- alwaysApply: true (mirrors .cursor/rules/coding-standard.mdc § REACT NATIVE) -->

Also apply all rules in the root [CLAUDE.md](../CLAUDE.md).

## Agent Usage

When working on this repository, **always use the `frontend-developer` agent** (defined in `.claude/agents/love-scope-frontend.md`) via the Task tool for all frontend tasks — screens, UI components, hooks, navigation, styling, API integration on the frontend, Redux state management, form implementations, animations, and debugging.

- **Backend changes** (API routes, database models, migrations, schemas, repositories, middleware) belong in the sibling repository at `d:/love-scope/love-scope-backend` and should use the `backend-developer` agent.
- When a task requires both frontend and backend changes, launch the appropriate agent for each repository.

---

## Project Stack
- **Framework**: React Native CLI (no Expo)
- **Language**: TypeScript (strict)
- **State**: Redux (`src/stateManagement/`)
- **Navigation**: React Navigation (`src/navigation/`)
- **Auth storage**: `react-native-keychain`

## Directory Structure
```
src/
├── assets/           # Images, fonts, icons
├── components/       # Reusable UI components
│   ├── auth/
│   ├── common/
│   ├── friends/
│   ├── model/
│   ├── subscription/
│   └── timeline/
├── config/           # API client, env config
├── constants/        # App-wide constants
├── contexts/         # React Context providers
├── hooks/            # Custom React hooks
├── interfaces/       # TypeScript interfaces & types
├── localization/     # i18n string files
├── navigation/       # Stack / tab navigator config
├── screens/          # Screen components (one folder per feature)
│   ├── analyzer/
│   ├── auth/
│   ├── chat/
│   ├── friends/
│   ├── notifications/
│   ├── onboarding/
│   ├── profile/
│   ├── settings/
│   ├── subscription/
│   └── timeline/
├── services/         # API call functions (no business logic)
├── skeletons/        # Loading skeleton components
├── stateManagement/  # Redux store + feature slices
├── storage/          # Secure/async storage helpers
├── styles/           # Global StyleSheet tokens and theme
├── utils/            # Utility / helper functions
└── validation/       # Yup / Zod schemas
```

---

## TypeScript Rules (from `standard_code/typescript.md`)
- `camelCase` for functions and variables.
- `PascalCase` for components, classes, interfaces.
- Use `"Id"`, `"3d"`, `"2d"` — not `ID`, `3D`, `2D`.
- **Double quotes** for all strings.
- **Semicolons** after every statement.
- **Never use `any`** — type everything explicitly.
- Use `undefined`; avoid `null`.
- `===` / `!==` always; never `==` / `!=`.
- If a TypeScript rule is disabled, add a comment justifying why.

## Import Order
Each group separated by one blank line:
1. React (`import React from 'react'`)
2. Third-party libraries (alphabetical)
3. Absolute project imports (alphabetical)
4. Relative imports (alphabetical)
5. `import * as …`
6. Side-effect imports (`import './file'`)

## Components & Layout
- **Functional components only** — no class components.
- Wrap every screen root in `SafeAreaView`.
- Use `KeyboardAvoidingView` on any screen with text inputs.
- Provide a **back button** on every screen that isn't a tab root.
- Use the **common header component** — do not build ad-hoc headers.
- **Never use `TouchableWithoutFeedback`**.
- **Never use Expo** — React Native CLI only.

## Styling
- **No inline styles** — always `StyleSheet.create`.
- Use `Platform.OS === 'ios' | 'android'` for platform-specific styles.
- Colour tokens, font sizes, spacing in `src/styles/` — do not repeat values.

## Lists & Performance
- `FlatList` / `SectionList` / `VirtualizedList` for any list > a few items.
- Memoize with `React.memo`, `useMemo`, `useCallback`.
- Offload heavy computation off the UI thread.

## Navigation & State
- Keep navigation stacks simple — no excessive nesting.
- Handle `focus`, `blur`, `beforeRemove` events for cleanup.
- Pass large shared data via Redux/Context, not navigation params.
- Know the difference between **pushing** (new entry) and **navigating** (existing entry).

## Security & Storage
- **Never store JWTs, passwords, or API keys in `AsyncStorage`.**
- Use `react-native-keychain` for all sensitive values.
- Perform **both client-side and server-side validation**.
- Check internet connectivity — handle offline states to prevent crashes.

## Code Hygiene
- Remove all `console.log` before pushing.
- Lock dependency versions — remove `^` from `package.json`.
- Run ESLint before every commit.
- Install new packages only after TL approval.

## Lazy Loading
```typescript
if (enableVideo) {
  const VideoPlayer = require('react-native-video').default;
}
```
Use conditional `require` for heavy libraries; split heavy screens into separate bundles where possible.
