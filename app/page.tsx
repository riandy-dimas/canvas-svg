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
import { ChangeEvent, Fragment, useEffect, useRef, useState } from 'react'
import TextboxComponent from '@/components/textbox'
import {
  CANVAS_CONFIG,
  CONTROL_CONFIG,
  initGridSnap,
  fixTspanPosSVGObjImport,
  updateFontFamily,
  getGoogleFontFaceSrc,
} from '@/utils'
import { nanoid } from 'nanoid'
import {
  Image,
  Grid2x2Check,
  Grid2x2X,
  TypeOutline,
  Download,
  RotateCcw,
  Undo2,
  Redo2,
  X,
  Plus,
} from 'lucide-react'
import ImageComponent from '@/components/image'
import OtherComponent from '@/components/other'
import { useCanvasHistoryStack } from '@/hooks/useCanvasHistoryStack'
import { useCutCopyPaste } from '@/hooks/useCutCopyPaste'
import React from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import useHotKey from '@/hooks/useHotkey'

export default function Home() {
  const [isExporting, setExporting] = useState(false)
  const [selectedObject, setSelectedObject] = useState<FabricObject>()
  const [isShowGrid, setIsShowGrid] = useState<boolean>(false)
  const [gridObjects, setGridObjects] = useState<any>(null)

  const [activeTab, setActiveTab] = useState<number>(-1)
  const [initialMount, setInitialMount] = useState<boolean>(true)
  const [canvasTabObject, setCanvasTabObject] = useState<any>([
    {
      id: 'page_one',
      canvasObj: {
        version: '6.1.0',
        objects: [],
      },
    },
  ])

  const canvas = useRef<Canvas | null>(null)
  const {
    undo,
    redo,
    stackCursor,
    historyStack,
    saveState,
    updateTabHistoryStack,
    loadSnapshotFromLocalStorage,
    deletePageStackSnapshot,
  } = useCanvasHistoryStack(canvas.current)
  const { cut, copy, paste, duplicate } = useCutCopyPaste(canvas.current)
  const { getLocalStorage } = useLocalStorage()
  useHotKey('mod+z', undo)
  useHotKey('mod+shift+z', redo)
  useHotKey('mod+c', copy)
  useHotKey('mod+x', cut)
  useHotKey('mod+v', paste)
  useHotKey('mod+d', duplicate)
  useHotKey('delete', () => handleDeleteObject(canvas.current))

  useEffect(() => {
    // initial mount hack
    if (initialMount) {
      setActiveTab(0)
      setInitialMount(false)
      initializeCanvasFromLocalStorageSnapshot()
    } else {
      initializeCanvas()
    }
    return () => {
      canvas.current?.off('object:modified')
      canvas.current?.dispose()
      canvas.current = null
    }
  }, [activeTab])

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

  const initNewCanvasWithTab = (id: string) => new Canvas(id, CANVAS_CONFIG)
  const initializeCanvas = async () => {
    canvas.current = await initNewCanvasWithTab(canvasTabObject[activeTab]?.id)

    if (canvasTabObject[activeTab]?.canvasObj) {
      await canvas.current?.loadFromJSON(canvasTabObject[activeTab].canvasObj)
      await canvas.current?.renderAll()
    }

    canvas.current?.on('object:modified', () => {
      // TODO: should update canvasTabObj also, current tab object only updated when tab changed
      saveState(canvas.current, activeTab, false)
    })
  }
  const initializeCanvasFromLocalStorageSnapshot = async () => {
    const GLOBAL_SNAPSHOT = await getLocalStorage('CANVAS_SVG_GLOBAL_SNAPSHOT')
    if (GLOBAL_SNAPSHOT) {
      const firstSnapshot = GLOBAL_SNAPSHOT[0]
      const canvasObjFromSnapshot =
        firstSnapshot.snapshots[firstSnapshot.stackCursor]

      const canvasTabObjFromSnapshot = GLOBAL_SNAPSHOT.map(
        (snapshot: any, index: number) => {
          return {
            id: index === 0 ? 'page_one' : nanoid(),
            canvasObj: snapshot.snapshots[snapshot.stackCursor],
          }
        },
      )
      await setActiveTab(0)

      await canvas.current?.loadFromJSON(canvasObjFromSnapshot)
      await setCanvasTabObject(canvasTabObjFromSnapshot)
      await updateTabHistoryStack(0, 0)

      await loadSnapshotFromLocalStorage()
    }
  }

  const handleAddText = async (canvas: Canvas | null) => {
    canvas?.discardActiveObject()
    const text = new Textbox('', {
      snapAngle: CONTROL_CONFIG.snapAngle,
      snapThreshold: CONTROL_CONFIG.snapThreshold,
      editable: true,
      width: 200,
      textAlign: 'left',
      customId: nanoid(),
      fontFamily: 'Inter',
    })
    text.on('selected', (e) => {
      setSelectedObject(e.target)
    })
    text.on('deselected', () => {
      setSelectedObject(undefined)
    })

    await updateFontFamily('Inter', canvas, text)
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
    saveState(canvas, activeTab, false)
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
      !!canvas && canvas?.add(gridObj)
    } else {
      if (gridObjects) {
        !!canvas && canvas?.remove(gridObjects)
        setGridObjects(null)
      }
    }

    setIsShowGrid((prev) => !prev)
  }

  const handleExportSvg = async () => {
    if (!canvas) return
    setExporting(true)
    for (let i in canvasTabObject) {
      const canvasExportInstance = new Canvas('export', CANVAS_CONFIG)

      const canvasObjJsonRAW = canvasTabObject[i].canvasObj
      const canvasObj =
        await canvasExportInstance.loadFromJSON(canvasObjJsonRAW)

      let svgString = String(canvasObj.toSVG())

      if (CANVAS_CONFIG.shouldEmbedFontDefinition) {
        const fontFaceSrc = await getGoogleFontFaceSrc(CANVAS_CONFIG.fontUrl)
        svgString = svgString.replace(
          '<defs>',
          `<defs>\n<style>\n${fontFaceSrc}\n</style>`,
        )
      }

      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `page_${Number(i) + 1}.svg`
      a.click()

      canvasExportInstance.dispose()
    }

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

  const handleAddNewPage = async () => {
    const newId = nanoid()
    setCanvasTabObject([
      ...canvasTabObject,
      {
        id: newId,
        canvasObj: await initNewCanvasWithTab(newId).toJSON(),
      },
    ])
    handleActiveTabChange(canvasTabObject.length)
  }

  const handleActiveTabChange = async (index: number) => {
    const currentCanvasObj = await canvas.current?.toJSON()

    if (currentCanvasObj) {
      await setCanvasTabObject((prev: any) => {
        const newTabObject = [...prev]
        newTabObject[activeTab].canvasObj = currentCanvasObj
        return newTabObject
      })
    }

    await setActiveTab(index)
    await updateTabHistoryStack(activeTab, index)
  }

  const handleCloseTab = async (index: number) => {
    if (index === 0) return

    const newTabObject = [...canvasTabObject]
    newTabObject.splice(index, 1)
    await setCanvasTabObject(newTabObject)

    if (activeTab === index) {
      await updateTabHistoryStack(activeTab, index - 1)
      await setActiveTab(index - 1)
    }

    if (activeTab > index) {
      await updateTabHistoryStack(activeTab, activeTab - 1)
      await setActiveTab(activeTab - 1)
    }

    deletePageStackSnapshot(index)
  }

  return (
    <div className="grid grid-cols-[0.25fr_1fr]">
      {/* for export */}
      <div className="hidden">
        <canvas id="export" className="hidden" />
      </div>
      <div id="menu" className="min-w-[220px]">
        <ul className="div p-2 flex flex-col bg-base-200 rounded-lg rounded-r-none gap-1">
          <li className="flex flex-row items-center justify-between">
            <button
              className={clsx(
                'btn btn-block',
                isShowGrid ? 'btn-neutral' : 'btn-outline',
              )}
              onClick={() => toggleGrid(canvas?.current, !isShowGrid)}
            >
              {isShowGrid ? <Grid2x2Check size={20} /> : <Grid2x2X size={20} />}
              Grid Layouting
            </button>
          </li>
          <li>
            <div className="join grid grid-flow-col">
              <button
                className="btn btn-outline join-item"
                onClick={() => undo()}
                disabled={stackCursor < 0}
              >
                <Undo2 size={20} />
                Undo
              </button>
              <button
                className="btn btn-outline join-item"
                onClick={() => redo()}
                disabled={stackCursor === historyStack?.length - 1}
              >
                <Redo2 size={20} />
                Redo
              </button>
            </div>
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
            <label className="btn btn-outline btn-block" htmlFor="inputImage">
              <div
                className="tooltip p-0 flex items-center justify-center gap-2 w-full h-full"
                data-tip="Accept .png, .jpeg/.jpg, .svg"
              >
                <Image size={20} />
                Image
              </div>
            </label>
          </li>
        </ul>
        <ul className="menu bg-base-200 rounded-lg rounded-r-none gap-1">
          <li>
            <button
              className="btn btn-info"
              onClick={() => {
                handleExportSvg()
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
      <div role="tablist" className="tabs tabs-lifted mt-[-32px]">
        {canvasTabObject.map((tab: any, index: number) => (
          <Fragment key={`tab_control_${index}`}>
            <a
              role="tab"
              className={`tab !px-2 w-[100px] bg-white ${activeTab === index && 'tab-active'}`}
              onClick={() => handleActiveTabChange(index)}
            >
              <div className="flex flex-row items-center justify-between">
                {`Page ${index + 1}`}

                {index !== 0 && index === activeTab && (
                  <button
                    className="ml-1 btn btn-ghost btn-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCloseTab(index)
                    }}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </a>
            <div
              key={`tab_content_${index}`}
              role="tabpanel"
              className="tab-content bg-white w-fit border-none mt-0"
            >
              <div
                style={{
                  width: '297mm',
                  height: '210mm',
                  background: 'white',
                }}
                id={`canvas-${index}`}
              >
                <canvas id={tab.id} />
              </div>
            </div>
          </Fragment>
        ))}
        <a
          role="tab"
          className="tab bg-white h-[32px] w-[100px] !p-0"
          onClick={handleAddNewPage}
        >
          <button className="btn no-animation btn-neutral btn-xs h-full w-full rounded-b-none">
            <Plus size={14} />
            Add Page
          </button>
        </a>
      </div>
    </div>
  )
}
