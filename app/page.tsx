'use client'

import clsx from 'clsx'
import {
  Canvas,
  Textbox,
  FabricImage,
  loadSVGFromString,
  Line,
  Group,
} from 'fabric'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import TextboxComponent from '@/components/config/textbox'
import {
  updateFontFamily,
  CANVAS_CONFIG,
  CONTROL_CONFIG,
  initGridSnap,
  fixTspanPosSVGObjImport,
  useCanvasHistory,
} from '@/components/config/utils'

export default function Home() {
  const [isSelecting, setSelecting] = useState<boolean>(false)
  const [isShowGrid, setIsShowGrid] = useState<boolean>(false)
  const [gridObjects, setGridObjects] = useState<any>(null)
  const [historyStack, setHistoryStack] = useState<any>([])
  const [stackCursor, setStackCursor] = useState<number>(0)

  const canvas = useRef<Canvas | null>(null)

  const saveState = (newState: any) => {
    const state = newState.toJSON()
    setHistoryStack((prev) => [...prev, state])
    setStackCursor((prev) => prev + 1)

    console.log(historyStack)
  }

  useEffect(() => {
    console.log('re-render')
    canvas.current = initCanvas()

    // init grid snap
    canvas.current.on('object:moving', (options) => {
      // snap edges
      if (CONTROL_CONFIG.snap) {
        initGridSnap(options)
      }
    })

    // canvas.current.on('object:added', () => {
    //   saveState(canvas.current)
    // })

    canvas.current.on('object:modified', () => {
      saveState(canvas.current)
    })

    // canvas.current.on('object:removed', () => {
    //   saveState(canvas.current)
    // })

    return () => {
      canvas.current?.dispose()
      canvas.current = null
    }
  }, [])

  const initCanvas = () => new Canvas('c', CANVAS_CONFIG)

  const handleAddText = async (canvas: Canvas | null) => {
    const text = new Textbox('New text', {
      snapAngle: 45,
      snapThreshold: 1,
      editable: true,
      width: 200,
      fontSize: 20,
      textAlign: 'left',
      fontFamily: 'Roboto',
    })
    text.on('selected', (e) => {
      setSelecting(true)
    })
    text.on('deselected', () => {
      setSelecting(false)
    })
    await updateFontFamily('Roboto', canvas)

    canvas?.add(text)
    canvas?.bringObjectToFront(text)
  }

  const handleAddImage = (
    e: ChangeEvent<HTMLInputElement>,
    canvas: Canvas | null,
  ) => {
    if (!e?.target?.files?.[0]) return
    // if file is svg then load it as svg string
    if (e.target.files[0].type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onloadend = () => {
        loadSVGFromString(reader.result as string).then((output) => {
          fixTspanPosSVGObjImport({ output, setSelecting, canvas })
        })
      }
      reader.readAsText(e.target.files[0])
      return
    } else {
      const reader = new FileReader()
      reader.onloadend = () => {
        FabricImage.fromURL(reader.result as string).then((output) => {
          output.on('selected', (e) => {
            setSelecting(true)
          })
          output.on('deselected', () => {
            setSelecting(false)
          })
          canvas?.add(output)
        })
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleDeleteObject = (canvas: Canvas | null) => {
    const object = canvas?.getActiveObject()!
    canvas?.remove(object)
    setSelecting(false)
  }

  const toggleGrid = (canvas: Canvas | null, show: boolean) => {
    if (show) {
      const gridLines = []
      for (let i = 0; i < CANVAS_CONFIG.width / CONTROL_CONFIG.grid; i++) {
        // Y Line
        gridLines.push(
          new Line(
            [
              i * CONTROL_CONFIG.grid,
              0,
              i * CONTROL_CONFIG.grid,
              CANVAS_CONFIG.height,
            ],
            {
              stroke: '#ccc',
              selectable: false,
              hoverCursor: 'default',
              excludeFromExport: true,
              evented: false,
            },
          ),
        )
        // X Line
        gridLines.push(
          new Line(
            [
              0,
              i * CONTROL_CONFIG.grid,
              CANVAS_CONFIG.width,
              i * CONTROL_CONFIG.grid,
            ],
            {
              stroke: '#ccc',
              selectable: false,
              hoverCursor: 'default',
              excludeFromExport: true,
              evented: false,
            },
          ),
        )
      }

      const gridObj = new Group(gridLines, {
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        excludeFromExport: true,
      })
      setGridObjects(gridObj)
      // console.log(gridObj)
      !!canvas && canvas?.add(gridObj)
    } else {
      if (gridObjects) {
        !!canvas && canvas?.remove(gridObjects)
        setGridObjects(null)
      }
    }

    setIsShowGrid((prev) => !prev)
  }

  const handleExportSvg = (canvas: Canvas | null) => {
    if (!canvas) return

    const fontInjectScript = `<style>@import url('https://fonts.googleapis.com/css2?family=Mooli&amp;family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&amp;family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&amp;display=swap');</style>`

    const svgString = String(canvas.toSVG())
    const injectedSvg = svgString.replace(
      '<defs>',
      `<defs>\n${fontInjectScript}`,
    )
    const blob = new Blob([injectedSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'file.svg'
    a.click()
  }

  const Configuration = (props: { canvas?: Canvas | null }) => {
    if (!props.canvas?.getActiveObject()) return null
    if (props.canvas?.getActiveObject() instanceof Textbox) {
      return <TextboxComponent canvas={props?.canvas} />
    }
    return null
  }

  const undo = async (canvas: Canvas | null) => {
    if (!canvas) return
    if (stackCursor === 0) return

    setStackCursor((prev) => prev - 1)

    console.log(historyStack[stackCursor - 1])

    // canvas.clear()
    await canvas.loadFromJSON(historyStack[stackCursor - 1])
    await canvas?.renderAll()
    // canvas?.
  }

  const redo = async (canvas: Canvas | null) => {
    if (!canvas) return
    if (stackCursor === historyStack.length) return

    setStackCursor((prev) => prev + 1)

    // canvas.clear()
    await canvas.loadFromJSON(historyStack[stackCursor + 1])
    await canvas?.renderAll()
  }

  return (
    <div className="grid grid-cols-[0.25fr_1fr]">
      <div id="menu">
        <ul className="menu bg-base-200 rounded-lg rounded-r-none gap-1">
          <li className="flex flex-row items-center justify-between mb-4">
            <button
              className={`btn ${isShowGrid ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => toggleGrid(canvas?.current, !isShowGrid)}
            >
              #
            </button>
            <button
              className="btn btn-outline"
              onClick={() => undo(canvas?.current)}
              disabled={stackCursor === 0}
            >
              {`<`}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => redo(canvas?.current)}
              disabled={stackCursor === historyStack.length - 1}
            >
              {`>`}
            </button>
          </li>
          <li>
            <button
              className="btn btn-outline"
              onClick={() => handleAddText(canvas?.current)}
            >
              Add Text {stackCursor}
            </button>
          </li>
          <li>
            <input
              id="inputImage"
              onChange={(e) => handleAddImage(e, canvas?.current)}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              className="hidden"
              placeholder="Add image"
            />
            <label className="btn btn-outline" htmlFor="inputImage">
              Import Image (.png,.jpg,.svg)
            </label>
          </li>
          <li className="mt-2">
            <button
              className={clsx('btn btn-error', !isSelecting && 'btn-disabled')}
              role="button"
              aria-disabled={!isSelecting ? 'true' : 'false'}
              onClick={() => {
                handleDeleteObject(canvas?.current)
              }}
            >
              Delete Element
            </button>
          </li>
          <li>
            <button
              className="btn btn-info"
              onClick={() => {
                handleExportSvg(canvas?.current)
              }}
            >
              Export SVG
            </button>
          </li>
        </ul>
        <div className="bg-base-200 rounded-l-lg rounded-r-none mt-2 text-primary w-[200px]">
          <Configuration canvas={canvas?.current} />
        </div>
      </div>
      <div
        style={{ width: '297mm', height: '210mm', background: 'white' }}
        id="canvas"
      >
        <canvas id="c" />
      </div>
    </div>
  )
}
