import clsx from 'clsx'
import { Canvas, Textbox } from 'fabric'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react'
import FontFaceObserver from 'fontfaceobserver'
import { useCallback, useEffect, useState } from 'react'

export const CANVAS_CONFIG = {
  height: 794,
  width: 1123,
  renderOnAddRemove: true,
  preserveObjectStacking: true,
}

export const CONTROL_CONFIG = {
  grid: 40,
  snap: true,
  snapThreshold: 10,
}

export const fontDecoration = {
  bold: {
    name: 'fontWeight',
    icon: <Bold size={20} />,
    fn: (inactive: boolean) => (inactive ? 'bold' : 'normal'),
    value: 'bold',
  },
  italic: {
    name: 'fontStyle',
    icon: <Italic size={20} />,
    fn: (inactive: boolean) => (inactive ? 'italic' : 'normal'),
    value: 'italic',
  },
  underline: {
    name: 'underline',
    icon: <Underline size={20} />,
    fn: (val: boolean) => val,
    value: true,
  },
  textAlignLeft: {
    name: 'textAlign',
    icon: <AlignLeft size={20} />,
    fn: () => 'left',
    value: 'left',
  },
  textAlignCenter: {
    name: 'textAlign',
    icon: <AlignCenter size={20} />,
    fn: () => 'center',
    value: 'center',
  },
  textAlignRight: {
    name: 'textAlign',
    icon: <AlignRight size={20} />,
    fn: () => 'right',
    value: 'right',
  },
}

export const buttonDecorationBuilder = (
  props: {
    name: string
    icon: React.ReactNode
    fn: (val: boolean) => string | boolean
    value: string | boolean
  },
  value: string | boolean,
  onChange: (val: string | boolean) => void,
  canvas?: Canvas | null,
) => {
  return (
    <button
      className={clsx(
        'btn btn-sm join-item',
        value === props.value ? 'btn-primary' : 'btn-outline',
      )}
      onClick={() => {
        canvas
          ?.getActiveObject()
          ?.set(props.name, props.fn(value !== props.value))
        canvas?.requestRenderAll()
        onChange(props.fn(value !== props.value))
      }}
    >
      {props.icon}
    </button>
  )
}

export const updateFontFamily = async (
  font: string,
  canvas?: Canvas | null,
) => {
  var myfont = new FontFaceObserver(font)
  await myfont.load()
  if (!canvas) return
  // when font is loaded, use it.
  canvas.getActiveObject()?.set('fontFamily', font)
  canvas.requestRenderAll()
}

// @ts-expect-error; TODO: define types properly
export const fixTspanPosSVGObjImport = ({ output, setSelecting, canvas }) => {
  const { objects, elements } = output
  // @ts-expect-error; TODO: define tspan types properly
  objects.forEach((obj, index) => {
    if (obj && obj.type === 'text') {
      const currentElement = elements[index]
      if (
        currentElement.children.length > 0 &&
        currentElement.children[0].tagName === 'tspan'
      ) {
        const tspan = currentElement.children[0]

        const { x, y } = tspan.attributes

        // THE FIX: Update x and y position of text object
        obj.left += Number(x.value)
        obj.top += Number(y.value)
      }

      const text = new Textbox(obj.text, {
        ...obj,
        snapAngle: 45,
        snapThreshold: 1,
        editable: true,
      })

      text.on('selected', () => {
        setSelecting(true)
      })
      text.on('deselected', () => {
        setSelecting(false)
      })

      return canvas?.add(text)
    }
    obj && canvas?.add(obj)
  })
}

export const initGridSnap = (options: any) => {
  if (
    Math.round((options.target.left / CONTROL_CONFIG.grid) * 4) % 4 == 0 &&
    Math.round((options.target.top / CONTROL_CONFIG.grid) * 4) % 4 == 0
  ) {
    options.target
      .set({
        left:
          Math.round(options.target.left / CONTROL_CONFIG.grid) *
          CONTROL_CONFIG.grid,
        top:
          Math.round(options.target.top / CONTROL_CONFIG.grid) *
          CONTROL_CONFIG.grid,
      })
      .setCoords()
  }
  // Snap to left
  if (
    options.target.left < CONTROL_CONFIG.snapThreshold &&
    options.target.left > -CONTROL_CONFIG.snapThreshold
  ) {
    options.target
      .set({
        left: 0,
      })
      .setCoords()
  }
  // Snap to right
  const w = CANVAS_CONFIG.width
  if (
    options.target.left + options.target.width <
      w + CONTROL_CONFIG.snapThreshold &&
    options.target.left + options.target.width >
      w - CONTROL_CONFIG.snapThreshold
  ) {
    options.target
      .set({
        left: w - options.target.width,
      })
      .setCoords()
  }
  // Snap to top
  if (
    options.target.top < CONTROL_CONFIG.snapThreshold &&
    options.target.top > -CONTROL_CONFIG.snapThreshold
  ) {
    options.target
      .set({
        top: 0,
      })
      .setCoords()
  }
  // Snap to bottom
  const h = CANVAS_CONFIG.height
  if (
    options.target.top + options.target.height <
      h + CONTROL_CONFIG.snapThreshold &&
    options.target.top + options.target.height >
      h - CONTROL_CONFIG.snapThreshold
  ) {
    options.target
      .set({
        top: h - options.target.height,
      })
      .setCoords()
  }

  // Snap to center of the canvas
  const w2 = CANVAS_CONFIG.width / 2 // half of canvas width
  const oW2 = options.target.width / 2 // half of object width
  if (
    options.target.left + oW2 < w2 + CONTROL_CONFIG.snapThreshold &&
    options.target.left + oW2 > w2 - CONTROL_CONFIG.snapThreshold
  ) {
    options.target
      .set({
        left: w2 - oW2,
      })
      .setCoords()
  }
  const h2 = CANVAS_CONFIG.height / 2 // Half of canvas height
  const oH2 = options.target.height / 2 // Half of object height
  if (
    options.target.top + oH2 < h2 + CONTROL_CONFIG.snapThreshold &&
    options.target.top + oH2 > h2 - CONTROL_CONFIG.snapThreshold
  ) {
    options.target
      .set({
        top: h2 - oH2,
      })
      .setCoords()
  }
}

export const useCanvasHistoryStack = (canvas: Canvas | null) => {
  const [historyStack, setHistoryStack] = useState<any>([])
  const [stackCursor, setStackCursor] = useState<number>(-1)

  useEffect(() => {
    canvas?.on('object:modified', () => {
      saveState(canvas, false)
    })
  }, [canvas])

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
    undo,
    redo,
    stackCursor,
    historyStack,
  }
}
