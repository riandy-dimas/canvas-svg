import clsx from 'clsx'
import { Canvas, FabricObject, Textbox } from 'fabric'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react'
import FontFaceObserver from 'fontfaceobserver'
import { nanoid } from 'nanoid'
import { SVGParsingOutput } from '@/types'

export const CANVAS_CONFIG = {
  height: 794,
  width: 1123,
  renderOnAddRemove: true,
  preserveObjectStacking: true,
  shouldEmbedFontDefinition: false,
  fontUrl:
    'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
}

export const CONTROL_CONFIG = {
  grid: 40,
  snap: true,
  snapThreshold: 3,
  snapAngle: 45,
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
        value === props.value ? 'btn-neutral' : 'btn-outline',
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
  font?: string,
  canvas?: Canvas | null,
  textboxObject?: Textbox,
) => {
  if (!font) return
  var myfont = new FontFaceObserver(font)
  if (font !== 'Times New Roman') {
    await myfont.load()
  }
  if (!canvas) return
  if (textboxObject) {
    textboxObject.set('fontFamily', font)
  } else {
    canvas.getActiveObject()?.set('fontFamily', font)
  }
  canvas.requestRenderAll()
}

export const fixTspanPosSVGObjImport = ({
  output,
  setSelectedObject,
  canvas,
}: {
  output: SVGParsingOutput
  setSelectedObject: (object?: FabricObject) => void
  canvas?: Canvas | null
}) => {
  const { objects, elements } = output
  objects.forEach((obj, index) => {
    if (obj && obj instanceof Textbox) {
      const currentElement = elements[index]
      if (
        currentElement.children.length > 0 &&
        currentElement.children[0].tagName === 'tspan'
      ) {
        const tspan = currentElement.children[0]

        // @ts-expect-error
        const { x, y } = tspan.attributes

        // THE FIX: Update x and y position of text object
        obj.left += Number(x.value)
        obj.top += Number(y.value)
      }

      const text = new Textbox(obj.text, {
        ...obj,
        snapAngle: CONTROL_CONFIG.snapAngle,
        snapThreshold: CONTROL_CONFIG.snapThreshold,
        editable: true,
        customId: nanoid(),
      })

      text.on('selected', (e) => {
        setSelectedObject(e.target)
      })
      text.on('deselected', () => {
        setSelectedObject(undefined)
      })

      return canvas?.add(text)
    }

    if (obj) {
      obj.on('selected', (e) => {
        setSelectedObject(e.target)
      })
      obj.on('deselected', () => {
        setSelectedObject(undefined)
      })
      canvas?.add(obj)
    }
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

export const getFontList = () => {
  const regex = /family=([^:]+)/g
  return CANVAS_CONFIG.fontUrl.match(regex)?.map((value) => value.split('=')[1])
}

/** Font as Base64 related stuffs */

const getEmbeddedFontFromCSS = async (CSSText: string) => {
  const controller = new AbortController()

  const regex = /https:\/\/[^)]+/g
  const fontUrls = CSSText.match(regex)
  const fontLoaderPromises =
    fontUrls?.map((url) => {
      return new Promise<void>(async (resolve, reject) => {
        try {
          const response = await fetch(url)
          const fontBlob = await response.blob()

          const reader = new FileReader()
          reader.addEventListener(
            'load',
            () => {
              // Replace the font url(***) with actual Base64
              CSSText = CSSText.replace(url, String(reader.result))
              resolve()
            },
            { signal: controller.signal },
          )
          reader.readAsDataURL(fontBlob)
        } catch (e) {
          reject(`Font fetch error: ${e}`)
        }
      })
    }) || []
  try {
    await Promise.all(fontLoaderPromises)
    controller.abort()
    return CSSText
  } catch (e) {
    throw Promise.reject(e)
  }
}

export const getGoogleFontFaceSrc = async (fontHref: string) => {
  try {
    if (!fontHref.startsWith('https://fonts.googleapis.com')) {
      throw new Error('URL is not from Google Font')
    }
    return await (await fetch(fontHref)).text()
  } catch (e) {
    throw new Error(`Error Load Font`, { cause: e })
  }
}

export const getGoogleFontAsBase64 = async (fontHref: string) => {
  try {
    const fetchedCSSText = await getGoogleFontFaceSrc(fontHref)
    const embeddedFonts = await getEmbeddedFontFromCSS(fetchedCSSText)
    return embeddedFonts
  } catch (e) {
    throw new Error(`Error Load Font`, { cause: e })
  }
}
