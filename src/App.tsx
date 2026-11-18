import { useEffect, useState } from 'react'

type Phase = 'ready' | 'memorize' | 'recall' | 'result'

const TOTAL_CELLS = 16
const TARGET_COUNT = 6

const DAILY_STORAGE_KEY = 'afterlight-daily-history';

type DailyRecord = {
  date: string;
  score: number;
};

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function getDailyHistory(): DailyRecord[] {
  try {
    return JSON.parse(localStorage.getItem(DAILY_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function getDailyStreak(history: DailyRecord[]) {
  const dates = new Set(history.map(record => record.date))
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  if (!dates.has(getDateKey(today))) {
    today.setUTCDate(today.getUTCDate() - 1)
  }

  let streak = 0
  while (dates.has(getDateKey(today))) {
    streak++
    today.setUTCDate(today.getUTCDate() - 1)
  }

  return streak
}

function getDailyNumber() {
  const start = new Date(Date.UTC(2026, 10, 18))
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const days = Math.floor((today.getTime() - start.getTime()) / 86400000)
  return Math.max(1, days + 1).toString().padStart(3, '0')
}

function getDailyPattern() {
  const key = new Date().toISOString().slice(0, 10)
  let seed = 0

  for (const char of key) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0
  }

  const values = Array.from({ length: TOTAL_CELLS }, (_, i) => i)

  for (let i = values.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[values[i], values[j]] = [values[j], values[i]]
  }

  return values.slice(0, TARGET_COUNT)
}

function getRandomPattern() {
  const values = Array.from({ length: TOTAL_CELLS }, (_, i) => i);

  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    ;[values[i], values[j]] = [values[j], values[i]];
  }

  return values.slice(0, TARGET_COUNT);
}

type GameMode = 'daily' | 'practice';

function App() {
  const [phase, setPhase] = useState<Phase>('ready')
  const [seconds, setSeconds] = useState(5)
  const [selected, setSelected] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [missedCount, setMissedCount] = useState(0)

  const [pattern, setPattern] = useState<number[]>(getDailyPattern);
  const [gameMode, setGameMode] = useState<GameMode>('daily')
  const [completedToday, setCompletedToday] = useState(
    () => getDailyHistory().some(record => record.date === getDateKey())
  )
  const [dailyStreak, setDailyStreak] = useState(
    () => getDailyStreak(getDailyHistory())
  )

  useEffect(() => {
    if (phase !== 'memorize' && phase !== 'recall') return

    const timer = window.setInterval(() => {
      setSeconds(current => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (seconds !== 0) return

    if (phase === 'memorize') {
      setPhase('recall')
      setSeconds(20)
    } else if (phase === 'recall') {
      finishAnswer()
    }
  }, [seconds, phase])

  function startGame(mode: GameMode) {
    if (mode === 'daily' && completedToday) return;
    setGameMode(mode);
    setPattern(mode === 'daily' ? getDailyPattern() : getRandomPattern());
    setSelected([])
    setScore(0)
    setMistakes(0)
    setCorrectCount(0)
    setWrongCount(0)
    setMissedCount(0)
    setSeconds(5)
    setPhase('memorize')
  }

  function toggleCell(index: number) {
    if (phase !== 'recall') return

    setSelected(current => {
      if (current.includes(index)) {
        return current.filter(cell => cell !== index)
      }

      if (current.length >= TARGET_COUNT) return current

      return [...current, index]
    })
  }

  function finishAnswer() {
    const correct = selected.filter(cell => pattern.includes(cell)).length
    const wrong = selected.length - correct
    const missed = TARGET_COUNT - correct

    const finalScore = Math.round((correct / TARGET_COUNT) * 100)

    setScore(finalScore)
    setMistakes(wrong + missed)
    setCorrectCount(correct)
    setWrongCount(wrong)
    setMissedCount(missed)
    if (gameMode === 'daily') {
      const today = getDateKey();
      const history = getDailyHistory().filter(record => record.date !== today);
      history.push({ date: today, score: finalScore });
      localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(history));
      setCompletedToday(true);
      setDailyStreak(getDailyStreak(history));
    }

    setPhase('result')
    setSeconds(0)
  }

  function submitAnswer() {
    finishAnswer()
  }

  async function shareResult() {
    const shareGrid = Array.from({ length: 4 }, (_, row) =>
      Array.from({ length: 4 }, (_, col) => {
        const cell = row * 4 + col
        if (pattern.includes(cell) && selected.includes(cell)) return '🟩'
        if (pattern.includes(cell)) return '🟨'
        if (selected.includes(cell)) return '🟥'
        return '⬛'
      }).join('')
    ).join('\n')

    const shareText = [
      `✳ AFTERLIGHT — ${gameMode === 'daily' ? 'DAILY #' + getDailyNumber() : 'PRACTICE'}`,
      dateLabel,
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
      'Can you beat my score?'
    ].join('\n')

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'AFTERLIGHT — Daily Challenge',
          text: shareText
        })
        return
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
    }

    try {
      await navigator.clipboard.writeText(shareText)
      window.alert('Result copied! Share it with your friends.')
    } catch {
      window.alert('Sharing is unavailable in this browser.')
    }
  }

  const dateLabel = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date())

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
            <div className="round-tag">{gameMode === 'daily' ? `DAILY #${getDailyNumber()}` : 'PRACTICE'}</div>
          )}
        </div>

        <div className={`game-board ${phase}`}>
          {Array.from({ length: TOTAL_CELLS }, (_, index) => {
            const illuminated = pattern.includes(index)
            const active = selected.includes(index)

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
                  phase === 'result' && illuminated && !active ? 'result-missed' : ''
                ].join(' ')}
                onClick={() => toggleCell(index)}
                disabled={phase !== 'recall'}
                aria-label={`Cell ${index + 1}`}
              >
                {phase === 'memorize' && illuminated && (
                  <span className="light-dot" />
                )}
                {phase === 'recall' && active && (
                  <span className="light-dot" />
                )}
                {phase === 'result' && illuminated && (
                  <span className="light-dot" />
                )}
              </button>
            )
          })}
        </div>

        <div className="game-instructions">
          {phase === 'ready' && (
            <p>Six positions will illuminate. Memorize their locations.</p>
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

        {phase === 'ready' && (
          <div className="mode-buttons">
            <button
              className="primary-button"
              onClick={() => startGame('daily')}
              disabled={completedToday}
            >
              {completedToday ? 'Daily challenge completed' : 'Begin daily challenge'}
              <span>{completedToday ? '✓' : '→'}</span>
            </button>
            {completedToday && (
              <p className="daily-complete-note">
                You've completed today's pattern. Come back tomorrow for a new challenge.
              </p>
            )}
            <button className="secondary-button" onClick={() => startGame('practice')}>
              Start random practice
            </button>
          </div>
        )}

        {phase === 'recall' && (
          <button
            className="primary-button"
            onClick={submitAnswer}
            disabled={selected.length !== TARGET_COUNT}
          >
            Lock in answer <span>→</span>
          </button>
        )}

        {phase === 'result' && (
          <div className="result-actions">
            <p>{gameMode === 'daily' ? "Today's daily pattern has been revealed." : 'Practice pattern revealed. Try another random round.'}</p>
            <button className="primary-button" onClick={shareResult}>
              Share result <span>↗</span>
            </button>
            <button className="secondary-button" onClick={() => setPhase('ready')}>
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
  )
}

export default App
