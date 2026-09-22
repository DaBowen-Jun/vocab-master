import { useState } from 'react'
import { TopBar, TabBar } from './components/common'
import { StageProvider } from './lib/stageContext'
import { Home } from './pages/Home'
import { Learn } from './pages/Learn'
import { Exam } from './pages/Exam'
import { WordBook } from './pages/WordBook'
import { Stats } from './pages/Stats'
import { FeatureMap } from './pages/FeatureMap'
import { Camp } from './pages/Camp'

export default function App() {
  const [view, setView] = useState('home')
  return (
    <StageProvider>
      <div className="min-h-full flex flex-col">
        <TopBar />
        <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-5">
          {view === 'home' && <Home onNavigate={setView} />}
          {view === 'learn' && <Learn />}
          {view === 'exam' && <Exam />}
          {view === 'book' && <WordBook />}
          {view === 'stats' && <Stats />}
          {view === 'camp' && <Camp />}
          {view === 'map' && <FeatureMap />}
        </main>
        <footer className="mx-auto max-w-3xl w-full px-4 py-6 pb-24 text-center text-xs text-slate-400">
          词力星球 · 三学段背单词闯关 Demo ｜ 数据保存在本地浏览器
        </footer>
        <TabBar active={view} onChange={setView} />
      </div>
    </StageProvider>
  )
}
