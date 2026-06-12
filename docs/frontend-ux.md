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

## Startup Sequence

The first stage should behave like an arriving station board.

- Show a departure-board style splash screen.
- Include a small flap/ticker strip with short game-joke style messages.
- Auto-transition to the main page after 10 seconds.
- Keep the transition smooth and obvious.

## Main Shell

The main page should feel like a station control room rather than a marketing landing page.

- Use a 2x2 service grid or similar compact control surface.
- Mark heavy resource services with a node target such as `rtx5070` or another worker node.
- Make the lower horizontal area a train track with a moving train marker instead of a generic scroll footer.
- Keep service status visible without deep navigation.

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
