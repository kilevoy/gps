import { useState } from 'react'
import { CalculatorPage } from './pages/CalculatorPage'
import { MethodologyPage } from './pages/MethodologyPage'
import { ThemeToggle } from './components/theme/ThemeToggle'
import { useTheme } from './components/theme/useTheme'

type Tab = 'calc' | 'method'

export default function App() {
  const { theme, toggle } = useTheme()
  const [tab, setTab] = useState<Tab>('calc')

  return (
    <main className="min-h-screen px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="surface flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="h-display text-lg leading-tight sm:text-xl">
                Калькулятор профилей ИНСИ
              </h1>
              <p className="text-xs font-medium text-ink-500 dark:text-ink-300">
                Версия 2 — UI/UX, схемы, методика
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <button
              type="button"
              className="nav-link"
              data-active={tab === 'calc'}
              onClick={() => setTab('calc')}
            >
              <NavIcon name="calc" /> Калькулятор
            </button>
            <button
              type="button"
              className="nav-link"
              data-active={tab === 'method'}
              onClick={() => setTab('method')}
            >
              <NavIcon name="book" /> Методика
            </button>
            <span className="mx-1 h-6 w-px bg-ink-200 dark:bg-ink-700" />
            <ThemeToggle theme={theme} onToggle={toggle} />
          </nav>
        </header>

        {tab === 'calc' ? <CalculatorPage isDark={theme === 'dark'} /> : <MethodologyPage />}

        <footer className="px-2 pt-2 text-center text-xs text-ink-400">
          ИНСИ · Профильный калькулятор · v2 prototype
        </footer>
      </div>
    </main>
  )
}

function Logo() {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
      style={{
        background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))',
        boxShadow: '0 8px 18px -8px color-mix(in srgb, var(--color-brand-600) 70%, transparent)',
      }}
      aria-hidden
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 4 H19 V8 M5 4 V20 M5 20 H19 V16" />
      </svg>
    </div>
  )
}

function NavIcon({ name }: { name: 'calc' | 'book' }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (name === 'calc') {
    return (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8M8 11h8M8 15h4" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z" />
      <path d="M4 17a3 3 0 0 1 3-3h12" />
    </svg>
  )
}
