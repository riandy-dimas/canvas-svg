import { Canvas } from 'fabric'
import { useState, useEffect } from 'react'

export const useCanvasHistoryStack = (canvas: Canvas | null) => {
  const [historyStack, setHistoryStack] = useState<any>([])
  const [stackCursor, setStackCursor] = useState<number>(-1)

  useEffect(() => {
    const isUndoState = stackCursor < historyStack.length - 1

    isUndoState && saveState(canvas, true)
  }, [historyStack])

  const saveState = (newCanvas: Canvas | null, shouldClearFuture?: boolean) => {
    if (!newCanvas) return
    const state = newCanvas.toJSON()

    console.log(shouldClearFuture)

    setHistoryStack((prev: any) => {
      if (shouldClearFuture) {
        const newStack = prev.slice(0, stackCursor + 1)
        return [...newStack, state]
      } else {
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

  return {
    saveState,
    undo,
    redo,
    stackCursor,
    historyStack,
  }
}
