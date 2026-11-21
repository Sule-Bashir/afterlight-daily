# ✳ AFTERLIGHT — The Vanishing Pattern

**Memory fades. Patterns remain.**

AFTERLIGHT is a daily visual memory game built for Reddit using Devvit Web and Interactive Posts.

**One day. One pattern. Six lights to remember.**

Players briefly study six highlighted cells, wait for the pattern to disappear, and then reconstruct it from memory before time runs out.

## How to Play

1. Open the daily challenge.
2. Memorize the six highlighted cells during the 5-second preview.
3. Recreate the pattern by selecting the cells you remember.
4. Submit your answer to see your accuracy and score.
5. Return tomorrow for a new daily pattern.

### Game Modes

- **Daily Challenge:** One shared pattern per day, with results saved to the player's Reddit account.
- **Random Practice:** Play additional rounds without affecting daily completion or streaks.

## Scoring

Each challenge contains a 4 × 4 grid with 6 correct cells to remember.

Your result shows:
- Correct selections
- Incorrect selections
- Missed cells
- Overall accuracy

The recall phase lasts 20 seconds.

Daily results are saved server-side. Players can retry saving after a network failure without submitting a second daily result.

## Daily Progress

AFTERLIGHT tracks daily completion and consecutive-day streaks.

The daily pattern is generated deterministically from the date, ensuring that players receive the same challenge for that day.

## Built With

- [Devvit Web](https://developers.reddit.com/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- Devvit Redis for daily result persistence

## Project Structure

\`\`\`text
src/
  client/
    game.tsx
    splash.tsx
    afterlight.css
    index.css
  server/
    core/
    routes/
  shared/
    game-logic.ts
    game-logic.test.ts
\`\`\`

- `src/client/` — Game interface and player interactions.
- `src/server/` — Devvit server routes and Reddit integration.
- `src/shared/` — Shared daily pattern generation and scoring logic.

## Development

Install dependencies:

\`\`\`bash
npm install
\`\`\`

Run all checks:

\`\`\`bash
npm run test:types && npm run lint && npm run build && npm run test:unit
\`\`\`

Build and playtest on Reddit:

\`\`\`bash
npx devvit playtest
\`\`\`

## Hackathon

Built for **Reddit's Game of the Day Hackathon 2026**.

AFTERLIGHT turns visual memory training into a small, satisfying daily ritual through simple gameplay, consistent daily challenges, and a Reddit-native experience.

## Status

The core game, shared scoring logic, daily result persistence, streak tracking, practice mode, and result-sharing flow are implemented.

The app is uploaded to Reddit and installed in `r/afterlight_recall_dev`.

Verified features:
- Daily challenge and completion persistence.
- Random practice mode.
- Pattern scoring and result screens.
- Daily streak tracking.
- Result sharing.
- Successful Reddit Interactive Post playtesting.
- Automated type checks, linting, production build, and unit tests.

The public interactive demo is available here:

https://www.reddit.com/r/afterlight_recall_dev/s/FH76txNfFH

**AFTERLIGHT — Remember what you see. Rebuild what disappears.**
