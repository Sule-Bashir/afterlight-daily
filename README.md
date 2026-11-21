# ✳ AFTERLIGHT — The Vanishing Pattern

**Memory fades. Patterns remain.**

AFTERLIGHT is a daily visual memory game built for Reddit using Devvit Web and Interactive Posts.

Players briefly study a pattern of highlighted cells, wait for it to disappear, and then recreate it from memory.

## How to Play

1. Open the daily challenge.
2. Memorize the six highlighted cells during the preview.
3. Recreate the pattern by selecting the cells you remember.
4. Submit your answer to see your accuracy and score.
5. Return tomorrow for a new daily pattern.

### Game Modes

- **Daily Challenge:** One shared pattern per day, with results saved to the player's Reddit account.
- **Practice Mode:** Play for additional practice without affecting daily completion.

## Scoring

Each challenge contains 16 cells, with 6 correct cells to remember.

Your score is based on the number of correctly selected cells:

- Correct selections
- Incorrect selections
- Missed cells
- Overall accuracy

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

```text
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
```

- `src/client/` — Game interface and player interactions.
- `src/server/` — Devvit server routes and Reddit integration.
- `src/shared/` — Shared daily pattern generation and scoring logic.

## **Development**

Install dependencies:
```
npm install
```

Run the project checks:
```
npm run test:types
npm run lint
npm run build
npm run test:unit
```

Run all checks together:
```
npm run test:types && npm run lint && npm run build && npm run test:unit
```

Upload the app:
```
npm run deploy
```

Start a Reddit playtest:
```
npm run dev
```

Reddit playtesting requires an authorized developer account. The developer account is authenticated and the app has been successfully playtested in the test subreddit.

## **Hackathon**

Built for **Reddit's Game of the Day Hackathon 2026**.



The goal is to make memory training a small, satisfying daily ritual through simple gameplay, consistent daily challenges, and a polished Reddit-native experience.

## **Status**

The core game, shared scoring logic, daily result persistence, streak tracking, practice mode, and retry-saving flow are implemented.

The app is uploaded to Reddit and installed in `r/afterlight_recall_dev`.

Verified gameplay features:
- Daily challenge and daily completion persistence.
- Random practice mode.
- Pattern scoring and result screens.
- Daily streak tracking.
- Result sharing.
- Automated type checks, linting, build, and unit tests.

Final hackathon submission preparation and public judging access remain to be completed.

**AFTERLIGHT — Remember what you see. Rebuild what disappears.**
