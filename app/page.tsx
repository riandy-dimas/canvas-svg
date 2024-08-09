'use client'

import clsx from 'clsx'
import fabric, {
  Canvas,
  Textbox,
  FabricObject,
  FabricImage,
  loadSVGFromString,
  loadSVGFromURL,
  FabricText,
} from 'fabric'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import TextboxComponent from '@/components/config/textbox'
import { updateFontFamily } from '@/components/config/utils'

export default function Home() {
  const [isSelecting, setSelecting] = useState<boolean>(false)
  const canvas = useRef<Canvas | null>(null)

  useEffect(() => {
    canvas.current = initCanvas()

    return () => {
      canvas.current?.dispose()
      canvas.current = null
    }
  }, [])

  const initCanvas = () =>
    new Canvas('c', {
      height: 794,
      width: 1123,
      renderOnAddRemove: true,
      preserveObjectStacking: true,
    })

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
          const { objects, elements } = output

          objects.forEach((obj, index) => {
            if (obj && obj.type === 'text') {
              const currentElement = elements[index]
              if (
                currentElement.children.length > 0 &&
                currentElement.children[0].tagName === 'tspan'
              ) {
                const tspan = currentElement.children[0]
                // @ts-expect-error; TODO: define tspan types properly
                const { x, y } = tspan.attributes

                // THE FIX: Update x and y position of text object
                obj.left += Number(x.value)
                obj.top += Number(y.value)
              }
              // @ts-expect-error; TODO: define obj types properly
              const text = new Textbox(obj.text, {
                ...obj,
                snapAngle: 45,
                snapThreshold: 1,
                editable: true,
              })

              text.on('selected', (e) => {
                setSelecting(true)
              })
              text.on('deselected', () => {
                setSelecting(false)
              })

              return canvas?.add(text)
            }
            obj && canvas?.add(obj)
          })
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

  return (
    <div className="grid grid-cols-[0.25fr_1fr]">
      <div id="menu">
        <ul className="menu bg-base-200 rounded-lg rounded-r-none gap-1">
          <li>
            <button
              className="btn btn-outline"
              onClick={() => handleAddText(canvas?.current)}
            >
              Add Text
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
