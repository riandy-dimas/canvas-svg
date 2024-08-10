'use client'

import clsx from 'clsx'
import {
  Canvas,
  Textbox,
  FabricImage,
  loadSVGFromString,
  Line,
  Group,
  FabricObject,
  BasicTransformEvent,
  TPointerEvent,
} from 'fabric'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import TextboxComponent from '@/components/config/textbox'
import {
  updateFontFamily,
  CANVAS_CONFIG,
  CONTROL_CONFIG,
  initGridSnap,
  fixTspanPosSVGObjImport,
  getGoogleFontAsBase64,
} from '@/components/config/utils'
import { nanoid } from 'nanoid'
import {
  Image,
  Grid2x2Check,
  Grid2x2X,
  TypeOutline,
  Download,
} from 'lucide-react'
import ImageComponent from '@/components/config/image'
import OtherComponent from '@/components/config/other'

export default function Home() {
  const [isExporting, setExporting] = useState(false)
  const [selectedObject, setSelectedObject] = useState<FabricObject>()
  const [isShowGrid, setIsShowGrid] = useState<boolean>(false)
  const [gridObjects, setGridObjects] = useState<any>(null)

  const canvas = useRef<Canvas | null>(null)

  useEffect(() => {
    canvas.current = initCanvas()

    return () => {
      canvas.current?.dispose()
      canvas.current = null
    }
  }, [])

  useEffect(() => {
    const handler = (
      options: BasicTransformEvent<TPointerEvent> & {
        target: FabricObject
      },
    ) => {
      if (CONTROL_CONFIG.snap && isShowGrid) {
        initGridSnap(options)
      }
    }

    canvas.current?.on('object:moving', handler)

    return () => {
      canvas.current?.off('object:moving', handler)
    }
  }, [isShowGrid])

  const initCanvas = () => new Canvas('c', CANVAS_CONFIG)

  const handleAddText = async (canvas: Canvas | null) => {
    canvas?.discardActiveObject()
    const text = new Textbox('New text', {
      snapAngle: CONTROL_CONFIG.snapAngle,
      snapThreshold: CONTROL_CONFIG.snapThreshold,
      editable: true,
      width: 200,
      fontSize: 20,
      textAlign: 'left',
      fontFamily: 'Inter',
      customId: nanoid(),
    })
    text.on('selected', (e) => {
      setSelectedObject(e.target)
    })
    text.on('deselected', () => {
      setSelectedObject(undefined)
    })
    await updateFontFamily('Inter', canvas)

    canvas?.add(text)
    canvas?.bringObjectToFront(text)
    canvas?.setActiveObject(text)
  }

  const handleAddImage = (
    e: ChangeEvent<HTMLInputElement>,
    canvas: Canvas | null,
  ) => {
    canvas?.discardActiveObject()
    if (!e?.target?.files?.[0]) return
    // if file is svg then load it as svg string
    if (e.target.files[0].type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onloadend = () => {
        loadSVGFromString(reader.result as string).then((output) => {
          fixTspanPosSVGObjImport({ output, setSelectedObject, canvas })
        })
      }
      reader.readAsText(e.target.files[0])
      return
    } else {
      const reader = new FileReader()
      reader.onloadend = () => {
        FabricImage.fromURL(reader.result as string, undefined, {
          customId: nanoid(),
          snapAngle: CONTROL_CONFIG.snapAngle,
          snapThreshold: CONTROL_CONFIG.snapThreshold,
        }).then((output) => {
          output.on('selected', (e) => {
            setSelectedObject(e.target)
          })
          output.on('deselected', () => {
            setSelectedObject(undefined)
          })
          canvas?.add(output)
          canvas?.setActiveObject(output)
        })
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleDeleteObject = (canvas?: Canvas | null) => {
    const object = canvas?.getActiveObject()!
    canvas?.remove(object)
    setSelectedObject(undefined)
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
              opacity: 0.4,
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
              opacity: 0.4,
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

  const handleExportSvg = async (canvas: Canvas | null) => {
    if (!canvas) return
    setExporting(true)
    const base64Font = await getGoogleFontAsBase64(CANVAS_CONFIG.fontUrl)

    const svgString = String(canvas.toSVG())
    const injectedSvg = svgString.replace(
      '<defs>',
      `<defs>\n<style>\n${base64Font}\n</style>`,
    )
    const blob = new Blob([injectedSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'file.svg'
    a.click()
    setExporting(false)
  }

  const Configuration = (props: { canvas?: Canvas | null }) => {
    if (!props.canvas?.getActiveObject()) return null
    if (props.canvas?.getActiveObject() instanceof Textbox) {
      return (
        <TextboxComponent
          canvas={props?.canvas}
          onDelete={() => handleDeleteObject(props.canvas)}
        />
      )
    }
    if (props.canvas?.getActiveObject() instanceof FabricImage) {
      return (
        <ImageComponent
          canvas={props?.canvas}
          onDelete={() => handleDeleteObject(props.canvas)}
        />
      )
    }
    return (
      <OtherComponent
        canvas={props?.canvas}
        onDelete={() => handleDeleteObject(props.canvas)}
      />
    )
  }

  return (
    <div className="grid grid-cols-[0.25fr_1fr]">
      <div id="menu">
        <ul className="menu bg-base-200 rounded-lg rounded-r-none gap-1">
          <li>
            <button
              className={clsx(
                'btn',
                isShowGrid ? 'btn-neutral' : 'btn-outline',
              )}
              onClick={() => toggleGrid(canvas?.current, !isShowGrid)}
            >
              {isShowGrid ? <Grid2x2Check size={20} /> : <Grid2x2X size={20} />}
              Grid Layouting
            </button>
          </li>
        </ul>
        <ul className="menu bg-base-200 rounded-lg rounded-r-none gap-1">
          <li>
            <button
              className="btn btn-outline"
              onClick={() => handleAddText(canvas?.current)}
            >
              <TypeOutline size={20} />
              Text
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
            <div
              className="tooltip p-0"
              data-tip="Accept .png, .jpeg/.jpg, .svg"
            >
              <label className="btn btn-outline btn-block" htmlFor="inputImage">
                <Image size={20} />
                Image
              </label>
            </div>
          </li>
        </ul>
        <ul className="menu bg-base-200 rounded-lg rounded-r-none gap-1">
          <li>
            <button
              className="btn btn-info"
              onClick={() => {
                handleExportSvg(canvas?.current)
              }}
              disabled={isExporting}
            >
              {isExporting ? (
                <span className="loading loading-spinner"></span>
              ) : (
                <Download size={20} />
              )}
              Export as SVG
            </button>
          </li>
        </ul>
        <div className="bg-base-200 rounded-l-lg rounded-r-none mt-2 text-primary">
          <Configuration
            key={selectedObject?.customId}
            canvas={canvas?.current}
          />
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
