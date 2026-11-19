import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import {
  calculateScore,
  getDailyPattern,
  TARGET_COUNT,
  TOTAL_CELLS,
} from '../../shared/game-logic';
import type {
  InitResponse,
  SubmitRequest,
  SubmitResponse,
  ErrorResponse,
} from '../../shared/api';

export const api = new Hono();

const START_DATE = '2026-11-18';

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyNumber(date: string) {
  const start = new Date(`${START_DATE}T00:00:00Z`);
  const current = new Date(`${date}T00:00:00Z`);
  const days = Math.floor((current.getTime() - start.getTime()) / 86400000);

  return Math.max(1, days + 1)
    .toString()
    .padStart(3, '0');
}

function getDailyStreak(history: Record<string, string>, today: string) {
  const dates = new Set(Object.keys(history));
  const current = new Date(`${today}T00:00:00Z`);

  if (!dates.has(today)) {
    current.setUTCDate(current.getUTCDate() - 1);
  }

  let streak = 0;

  while (dates.has(current.toISOString().slice(0, 10))) {
    streak++;
    current.setUTCDate(current.getUTCDate() - 1);
  }

  return streak;
}

function getHistoryKey(userId: string) {
  return `afterlight:daily:${userId}`;
}

api.get('/init', async (c) => {
  const { postId, userId } = context;

  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'Post context is unavailable.',
      },
      400
    );
  }

  try {
    const date = getDateKey();
    const username = await reddit.getCurrentUsername();

    let completedToday = false;
    let dailyStreak = 0;

    if (userId) {
      const history = (await redis.hGetAll(getHistoryKey(userId))) ?? {};

      completedToday = Boolean(history[date]);
      dailyStreak = getDailyStreak(history, date);
    }

    return c.json<InitResponse>({
      type: 'init',
      postId,
      date,
      dailyNumber: getDailyNumber(date),
      username: username ?? 'anonymous',
      signedIn: Boolean(userId),
      completedToday,
      dailyStreak,
    });
  } catch (error) {
    console.error('AFTERLIGHT init error:', error);

    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'Could not load your daily challenge.',
      },
      500
    );
  }
});

api.post('/submit', async (c) => {
  const { postId, userId } = context;

  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'Post context is unavailable.',
      },
      400
    );
  }

  if (!userId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'Sign in to save your daily result.',
      },
      401
    );
  }

  try {
    const body = await c.req.json<SubmitRequest>();
    const selected = body.selected;

    if (
      !Array.isArray(selected) ||
      selected.length !== TARGET_COUNT ||
      selected.length > TARGET_COUNT ||
      selected.some(
        (cell) => !Number.isInteger(cell) || cell < 0 || cell >= TOTAL_CELLS
      ) ||
      new Set(selected).size !== selected.length
    ) {
      return c.json<ErrorResponse>(
        {
          status: 'error',
          message: 'Invalid answer.',
        },
        400
      );
    }

    const date = getDateKey();
    const pattern = getDailyPattern(date);

    const { score, correct, wrong, missed } = calculateScore(selected, pattern);

    const key = getHistoryKey(userId);

    const record = JSON.stringify({
      score,
      correct,
      wrong,
      missed,
    });

    const saved = await redis.hSetNX(key, date, record);

    const history = (await redis.hGetAll(key)) ?? {};
    const dailyStreak = getDailyStreak(history, date);

    if (saved === 0) {
      const previous = history[date]
        ? JSON.parse(history[date])
        : { score: 0, correct: 0, wrong: 0, missed: 6 };

      return c.json<SubmitResponse>({
        type: 'submit',
        accepted: false,
        alreadyCompleted: true,
        score: previous.score,
        correct: previous.correct,
        wrong: previous.wrong,
        missed: previous.missed,
        dailyStreak,
        completedToday: true,
      });
    }

    return c.json<SubmitResponse>({
      type: 'submit',
      accepted: true,
      alreadyCompleted: false,
      score,
      correct,
      wrong,
      missed,
      dailyStreak,
      completedToday: true,
    });
  } catch (error) {
    console.error('AFTERLIGHT submit error:', error);

    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'Could not save your daily result.',
      },
      500
    );
  }
});
