import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Stage } from './types'

export type StageFilter = Stage | 'all'

interface StageCtx {
  stage: StageFilter
  setStage: (s: StageFilter) => void
}

const Ctx = createContext<StageCtx>({ stage: 'all', setStage: () => {} })

export function StageProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<StageFilter>('all')
  return <Ctx.Provider value={{ stage, setStage }}>{children}</Ctx.Provider>
}

export function useStage() {
  return useContext(Ctx)
}
