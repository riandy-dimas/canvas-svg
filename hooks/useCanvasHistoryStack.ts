import { Canvas } from 'fabric'
import { useState, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export const useCanvasHistoryStack = (canvas: Canvas | null) => {
  const GLOBAL_SNAPSHOT_LS_KEY = 'CANVAS_SVG_GLOBAL_SNAPSHOT'
  const [pageStackSnapshot, setPageStackSnapshot] = useState<any>([])
  const [historyStack, setHistoryStack] = useState<any>([])
  const [stackCursor, setStackCursor] = useState<number>(-1)
  const [currentWorkingPage, setCurrentWorkingPage] = useState<number>(0)
  const { setLocalStorage, getLocalStorage } = useLocalStorage()

  useEffect(() => {
    if (!canvas) return
    if (!historyStack) {
      return
    }
    const isUndoState = stackCursor < historyStack.length - 1

    isUndoState && saveState(canvas, currentWorkingPage, true)
  }, [historyStack])

  const loadSnapshotFromLocalStorage = async () => {
    const snapshot = await getLocalStorage(GLOBAL_SNAPSHOT_LS_KEY)

    if (snapshot) {
      const firstSnapshot = snapshot[0]
      await setPageStackSnapshot(snapshot)
      await setStackCursor(firstSnapshot.stackCursor)
      await setHistoryStack(firstSnapshot.snapshots)
    }
  }

  useEffect(() => {
    const handleBeforeUnload = () => {
      setLocalStorage(GLOBAL_SNAPSHOT_LS_KEY, pageStackSnapshot)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pageStackSnapshot])

  const saveState = async (
    newCanvas: Canvas | null | undefined,
    activePage: number,
    shouldClearFuture?: boolean,
  ) => {
    if (!newCanvas) return
    setCurrentWorkingPage(activePage)
    const state = await newCanvas.toJSON()

    setHistoryStack((prev: any) => {
      if (shouldClearFuture) {
        const newStack = prev.slice(0, stackCursor + 1)
        updatePageStackSnapshot(activePage, [...newStack, state])
        return [...newStack, state]
      } else {
        updatePageStackSnapshot(activePage, [...prev, state])
        return [...prev, state]
      }
    })

    setStackCursor((prev) => {
      if (shouldClearFuture) {
        return stackCursor + 1
      } else {
        return prev + 1
      }
    })
  }

  const undo = async () => {
    if (!canvas || stackCursor < 0) return
    if (stackCursor === 0) {
      await canvas.clear()
      setStackCursor(-1)
      return
    }

    const undoState = historyStack[stackCursor - 1]
    if (undoState) {
      await canvas.loadFromJSON(historyStack[stackCursor - 1])
      await canvas?.renderAll()

      setStackCursor((prev) => prev - 1)
    }
  }

  const redo = async () => {
    if (!canvas || stackCursor >= historyStack.length - 1) return

    const redoState = historyStack[stackCursor + 1]
    if (redoState) {
      await canvas.loadFromJSON(redoState)
      await canvas.renderAll()
      setStackCursor((prev) => prev + 1)
    }
  }

  const updateTabHistoryStack = async (
    oldPageIndex: number,
    newPageIndex: number,
  ) => {
    const currentSnapshotList = JSON.parse(JSON.stringify(pageStackSnapshot))

    if (!currentSnapshotList[oldPageIndex]) {
      currentSnapshotList[oldPageIndex] = {
        stackCursor,
        snapshots: historyStack,
      }
    }

    const beforeChangeStackSnapshot = {
      stackCursor,
      snapshots: historyStack,
    }

    const loadedSnapshot =
      currentSnapshotList[newPageIndex] &&
      JSON.parse(JSON.stringify(currentSnapshotList[newPageIndex]))
    currentSnapshotList[oldPageIndex] = beforeChangeStackSnapshot

    await setPageStackSnapshot(currentSnapshotList)

    if (loadedSnapshot) {
      await setStackCursor(loadedSnapshot.stackCursor)
      await setHistoryStack(loadedSnapshot.snapshots)

      await canvas?.renderAll()
    }
  }

  const updatePageStackSnapshot = async (
    pageIndex: number,
    newHistoryStack: any,
  ) => {
    const currentSnapshotList = JSON.parse(JSON.stringify(pageStackSnapshot))

    currentSnapshotList[pageIndex] = {
      stackCursor: newHistoryStack.length - 1,
      snapshots: newHistoryStack,
    }

    await setPageStackSnapshot(currentSnapshotList)
  }

  const deletePageStackSnapshot = async (pageIndex: number) => {
    const currentSnapshotList = JSON.parse(JSON.stringify(pageStackSnapshot))

    currentSnapshotList.splice(pageIndex, 1)

    await setPageStackSnapshot(currentSnapshotList)
  }

  return {
    saveState,
    undo,
    redo,
    stackCursor,
    historyStack,
    updateTabHistoryStack,
    loadSnapshotFromLocalStorage,
    deletePageStackSnapshot,
  }
}
