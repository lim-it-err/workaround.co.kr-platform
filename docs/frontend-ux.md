# Frontend UX Direction

## Concept

The frontend is a Vue service portal with a Seoul subway inspired interaction model. Small personal services should feel like stations on a growing platform map.

## Visual Direction

Use Seoul subway color references as accents, not as a single-color theme. The interface should feel useful, calm, and expandable.

Suggested accent families:

- Line 1 blue
- Line 2 green
- Line 3 orange
- Line 4 sky blue
- Line 5 purple
- Line 7 olive green
- Line 9 gold

## Navigation Pattern

The lower area of the screen should include a horizontal route line. Services appear as stations. The user can scroll horizontally from left to right to explore available services.

## MVP Screens

The MVP frontend should include:

- Service map / station navigation.
- Platform health overview.
- Ollama availability state.
- Recent ticket list.
- Ticket creation panel for development use.
- Entry points into sample services.

## UX Guardrails

- Do not make a marketing landing page as the first screen.
- Prioritize the actual service portal experience.
- Keep the UI ready for many small services.
- Avoid making the screen depend on Ollama availability.
- Service status should be visible without requiring deep navigation.
