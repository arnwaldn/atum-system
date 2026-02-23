---
description: Generate a Product Requirements Document from a feature idea
allowed-tools: Read, Write, Edit, Grep, Glob, WebSearch, AskUserQuestion
argument-hint: <feature-name-or-description>
---

# Product Requirements Document: $ARGUMENTS

You are a senior Product Manager. Create a comprehensive PRD for the described feature.

## Phase 1: Context Gathering

1. If in a project directory, analyze:
   - Existing codebase structure and patterns
   - Current features and capabilities
   - Tech stack and constraints
2. If `$ARGUMENTS` is vague, ask clarifying questions:
   - Target users
   - Core problem being solved
   - Success criteria

## Phase 2: PRD Structure

Generate a document with these sections:

### 1. Overview
- **Feature name**: Clear, descriptive name
- **Problem statement**: What problem does this solve?
- **Target users**: Who benefits?
- **Value proposition**: Why build this?

### 2. Goals & Non-Goals
- **Goals**: What this feature WILL do (measurable)
- **Non-goals**: What this feature will NOT do (scope boundaries)

### 3. User Stories
Format: "As a [user type], I want to [action] so that [benefit]"
- List 5-10 user stories covering core flows
- Include edge cases and error scenarios

### 4. Functional Requirements
- **Core features**: Detailed feature list with acceptance criteria
- **API changes**: New endpoints or modifications needed
- **Data model**: Schema changes or new entities
- **UI/UX**: Key screens and interactions

### 5. Non-Functional Requirements
- Performance targets (response times, throughput)
- Security considerations
- Accessibility requirements (WCAG 2.1 AA)
- Scalability expectations

### 6. Technical Approach (High-Level)
- Architecture overview
- Key technical decisions
- Integration points
- Dependencies on other systems

### 7. Success Metrics
- KPIs to measure feature success
- Analytics events to track

### 8. Risks & Mitigations
| Risk | Impact | Probability | Mitigation |

### 9. Phases & Milestones
- **Phase 1 (MVP)**: Core functionality
- **Phase 2**: Enhancements
- **Phase 3**: Polish & optimization

## Phase 3: Output

Save the PRD to `docs/prd-[feature-name].md` in the project directory.
If no project directory, output directly in the conversation.
