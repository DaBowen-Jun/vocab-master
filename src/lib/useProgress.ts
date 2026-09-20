import { useSyncExternalStore } from 'react'
import { store } from './store'

export function useProgress() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
