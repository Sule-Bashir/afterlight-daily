import './index.css';
import './afterlight.css';
import { calculateScore, getDailyPattern, TARGET_COUNT, TOTAL_CELLS } from '../shared/game-logic';

import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  InitResponse,
  SubmitResponse,
  ErrorResponse,
} from '../shared/api';

type Phase = 'ready' | 'memorize' | 'recall' | 'result';
type GameMode = 'daily' | 'practice';


function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function getRandomPattern() {
  const values = Array.from(
    { length: TOTAL_CELLS },
    (_, index) => index
  );

  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = values[i]!;
    values[i] = values[j]!;
    values[j] = temp;
  }

  return values.slice(0, TARGET_COUNT);
}

export function App() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [seconds, setSeconds] = useState(5);
  const [selected, setSelected] = useState<number[]>([]);
  const [pattern, setPattern] = useState<number[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('daily');

  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);

  const [date, setDate] = useState(getDateKey());
  const [dailyNumber, setDailyNumber] = useState('001');
  const [signedIn, setSignedIn] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const finishing = useRef(false);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const response = await fetch('/api/init');

        if (!response.ok) {
          throw new Error('Could not load daily challenge.');
        }

        const data: InitResponse = await response.json();

        if (!active) return;

        setDate(data.date);
        setDailyNumber(data.dailyNumber);
        setSignedIn(data.signedIn);
        setCompletedToday(data.completedToday);
        setDailyStreak(data.dailyStreak);
        setPattern(getDailyPattern(data.date));
      } catch (error) {
        console.error('AFTERLIGHT initialization:', error);
        if (active) {
          setSaveError('Could not connect to the daily challenge. Please refresh.');
          setPattern(getDailyPattern(getDateKey()));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'memorize' && phase !== 'recall') return;

    const timer = window.setInterval(() => {
      setSeconds(current => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (seconds !== 0) return;

    const timeout = window.setTimeout(() => {
      if (phase === 'memorize') {
        setPhase('recall');
        setSeconds(20);
      } else if (phase === 'recall') {
        void finishAnswer();
      }
    }, 0);

    return () => window.clearTimeout(timeout);
    // finishAnswer uses the current render's game state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, phase]);

  function startGame(mode: GameMode) {
    if (loading || saving) return;
    if (mode === 'daily' && (!signedIn || completedToday)) return;

    finishing.current = false;
    setSaveError('');
    setGameMode(mode);
    setPattern(
      mode === 'daily' ? getDailyPattern(date) : getRandomPattern()
    );
    setSelected([]);
    setScore(0);
    setMistakes(0);
    setCorrectCount(0);
    setWrongCount(0);
    setMissedCount(0);
    setSeconds(5);
    setPhase('memorize');
  }

  function toggleCell(index: number) {
    if (phase !== 'recall') return;

    setSelected(current => {
      if (current.includes(index)) {
        return current.filter(cell => cell !== index);
      }

      if (current.length >= TARGET_COUNT) return current;

      return [...current, index];
    });
  }

  async function finishAnswer() {
    if (finishing.current) return;
    finishing.current = true;

    const { score: finalScore, correct, wrong, missed } =
      calculateScore(selected, pattern);

    setScore(finalScore);
    setMistakes(wrong + missed);
    setCorrectCount(correct);
    setWrongCount(wrong);
    setMissedCount(missed);
    setPhase('result');
    setSeconds(0);

    if (gameMode === 'practice') return;

    setSaving(true);
    setSaveError('');

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selected }),
      });

      const data: SubmitResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          'message' in data ? data.message : 'Could not save your result.'
        );
      }

      const result = data as SubmitResponse;

      setScore(result.score);
      setCorrectCount(result.correct);
      setWrongCount(result.wrong);
      setMissedCount(result.missed);
      setMistakes(result.wrong + result.missed);
      setDailyStreak(result.dailyStreak);
      setCompletedToday(result.completedToday);

      if (result.alreadyCompleted) {
        setSaveError('Your daily challenge was already recorded.');
      }
    } catch (error) {
      console.error('AFTERLIGHT submission:', error);
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Your result could not be saved. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  function submitAnswer() {
    if (selected.length !== TARGET_COUNT || saving) return;
    void finishAnswer();
  }

  async function shareResult() {
    const shareGrid = Array.from({ length: 4 }, (_, row) =>
      Array.from({ length: 4 }, (_, col) => {
        const cell = row * 4 + col;

        if (pattern.includes(cell) && selected.includes(cell)) return '🟩';
        if (pattern.includes(cell)) return '🟨';
        if (selected.includes(cell)) return '🟥';

        return '⬛';
      }).join('')
    ).join('\n');

    const formattedDate = new Intl.DateTimeFormat('en', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`));

    const shareText = [
      `✳ AFTERLIGHT — ${gameMode === 'daily' ? `DAILY #${dailyNumber}` : 'PRACTICE'}`,
      formattedDate,
      '',
      shareGrid,
      '',
      '🟩 Correct  🟨 Missed  🟥 Incorrect',
      '',
      `My score: ${score}%`,
      `Correct: ${correctCount}/6`,
      `Total errors: ${mistakes}`,
      `Current streak: ${dailyStreak} days`,
      '',
      'Memory fades. Patterns remain.',
      'Can you beat my score?',
    ].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'AFTERLIGHT — Daily Challenge',
          text: shareText,
        });
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(shareText);
      window.alert('Result copied! Share it with your friends.');
    } catch {
      window.alert(shareText);
    }
  }

  const dateLabel = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">✳</span>
          <span>AFTERLIGHT</span>
        </div>
        <span className="daily-label">DAILY CHALLENGE</span>
      </header>

      <section className="hero">
        <p className="eyebrow">{dateLabel.toUpperCase()}</p>
        <h1>Memory fades.<br /><span>Patterns remain.</span></h1>
        <p className="intro">
          Remember what you see. Rebuild what disappears.
        </p>
      </section>

      <section className="game-panel">
        <div className="game-heading">
          <div>
            <p className="eyebrow">THE VANISHING PATTERN</p>
            <h2>
              {phase === 'ready' && 'Ready yourself'}
              {phase === 'memorize' && 'Remember the light'}
              {phase === 'recall' && 'Rebuild the pattern'}
              {phase === 'result' && 'Challenge complete'}
            </h2>
          </div>

          {phase === 'memorize' || phase === 'recall' ? (
            <div className="timer">
              <span>{seconds}</span>
              <small>SEC</small>
            </div>
          ) : (
            <div className="round-tag">
              {gameMode === 'daily' ? `DAILY #${dailyNumber}` : 'PRACTICE'}
            </div>
          )}
        </div>

        <div className={`game-board ${phase}`}>
          {Array.from({ length: TOTAL_CELLS }, (_, index) => {
            const illuminated = pattern.includes(index);
            const active = selected.includes(index);

            return (
              <button
                key={index}
                className={[
                  'cell',
                  phase === 'memorize' && illuminated ? 'glowing' : '',
                  phase === 'recall' && active ? 'selected' : '',
                  phase === 'result' && illuminated ? 'revealed' : '',
                  phase === 'result' && illuminated && active ? 'result-correct' : '',
                  phase === 'result' && !illuminated && active ? 'result-incorrect' : '',
                  phase === 'result' && illuminated && !active ? 'result-missed' : '',
                ].join(' ')}
                onClick={() => toggleCell(index)}
                disabled={phase !== 'recall'}
                aria-label={`Cell ${index + 1}`}
              >
                {((phase === 'memorize' && illuminated) ||
                  (phase === 'recall' && active) ||
                  (phase === 'result' && illuminated)) && (
                  <span className="light-dot" />
                )}
              </button>
            );
          })}
        </div>

        <div className="game-instructions">
          {phase === 'ready' && (
            <p>
              {loading
                ? 'Loading your daily challenge...'
                : 'Six positions will illuminate. Memorize their locations.'}
            </p>
          )}

          {phase === 'memorize' && (
            <p>Study the glowing positions. They won't stay forever.</p>
          )}

          {phase === 'recall' && (
            <p>
              Select the six positions you remember.
              <strong> {selected.length}/6 selected</strong>
            </p>
          )}

          {phase === 'result' && (
            <div className="result-summary">
              <div className="score-number">{score}<small>%</small></div>
              <p>Pattern accuracy</p>

              <div className="performance-rating">
                {score >= 90 ? 'EXCEPTIONAL' :
                 score >= 70 ? 'SHARP' :
                 score >= 50 ? 'GETTING WARMER' :
                 'KEEP PRACTISING'}
              </div>

              <p className="mistake-count">{mistakes} total errors</p>

              <div className="result-breakdown">
                <div><strong>{correctCount}</strong><span>Correct</span></div>
                <div><strong>{wrongCount}</strong><span>Incorrect</span></div>
                <div><strong>{missedCount}</strong><span>Missed</span></div>
              </div>
            </div>
          )}
        </div>

        {saveError && (
          <p className="daily-complete-note">{saveError}</p>
        )}

        {phase === 'ready' && (
          <div className="mode-buttons">
            <button
              className="primary-button"
              onClick={() => startGame('daily')}
              disabled={loading || !signedIn || completedToday}
            >
              {loading
                ? 'Loading challenge...'
                : completedToday
                  ? 'Daily challenge completed'
                  : !signedIn
                    ? 'Sign in to play daily'
                    : 'Begin daily challenge'}
              <span>{completedToday ? '✓' : '→'}</span>
            </button>

            {completedToday && (
              <p className="daily-complete-note">
                You've completed today's pattern. Come back tomorrow for a new challenge.
              </p>
            )}

            {!signedIn && !loading && (
              <p className="daily-complete-note">
                Sign in to Reddit to save your daily score and streak.
              </p>
            )}

            <button
              className="secondary-button"
              onClick={() => startGame('practice')}
              disabled={loading}
            >
              Start random practice
            </button>
          </div>
        )}

        {phase === 'recall' && (
          <button
            className="primary-button"
            onClick={submitAnswer}
            disabled={selected.length !== TARGET_COUNT || saving}
          >
            Lock in answer <span>→</span>
          </button>
        )}

        {phase === 'result' && (
          <div className="result-actions">
            <p>
              {gameMode === 'daily'
                ? "Today's daily pattern has been revealed."
                : 'Practice pattern revealed. Try another random round.'}
            </p>

            {saving && <p>Saving your daily result...</p>}

            <button className="primary-button" onClick={shareResult}>
              Share result <span>↗</span>
            </button>

            <button
              className="secondary-button"
              onClick={() => {
                finishing.current = false;
                setSaveError('');
                setPhase('ready');
              }}
            >
              Review challenge
            </button>
          </div>
        )}
      </section>

      <section className="streak-panel">
        <div className="streak-icon">✦</div>
        <div>
          <strong>{dailyStreak} {dailyStreak === 1 ? 'DAY' : 'DAYS'}</strong>
          <span>CURRENT STREAK</span>
        </div>
      </section>

      <section className="stats">
        <div><strong>06</strong><span>LIGHTS</span></div>
        <div><strong>05s</strong><span>MEMORIZE</span></div>
        <div><strong>20s</strong><span>RECALL</span></div>
      </section>

      <footer>
        <span>ONE DAY. ONE PATTERN.</span>
        <span>AFTERLIGHT © 2026</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
