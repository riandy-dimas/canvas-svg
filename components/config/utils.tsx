import clsx from "clsx"
import { Canvas } from "fabric"
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from "lucide-react"
import FontFaceObserver from "fontfaceobserver"

export const fontDecoration = {
  bold: {
    name: 'fontWeight',
    icon: <Bold size={20} />,
    fn: (inactive: boolean) => inactive ? "bold" : "normal",
    value: 'bold'
  },
  italic: {
    name: 'fontStyle',
    icon: <Italic size={20} />,
    fn: (inactive: boolean) => inactive ? "italic" : "normal",
    value: 'italic'
  },
  underline: {
    name: 'underline',
    icon: <Underline size={20} />,
    fn: (inactive: boolean) => !inactive,
    value: true
  },
  textAlignLeft: {
    name: 'textAlign',
    icon: <AlignLeft size={20} />,
    fn: () => "left",
    value: "left"
  },
  textAlignCenter: {
    name: 'textAlign',
    icon: <AlignCenter size={20} />,
    fn: () => "center",
    value: "center"
  },
  textAlignRight: {
    name: 'textAlign',
    icon: <AlignRight size={20} />,
    fn: () => "right",
    value: "right"
  },
}

export const buttonDecorationBuilder = (
  props: { name: string, icon: React.ReactNode, fn: (val: boolean) => string | boolean, value: string | boolean },
  value: string | boolean,
  onChange: (val: string | boolean) => void,
  canvas?: Canvas | null
) => {
  return (
    <button
      className={clsx("btn btn-sm join-item", value === props.value ? 'btn-primary' : 'btn-outline')}
      onClick={() => {
        canvas?.getActiveObject()?.set(props.name, props.fn(value !== props.value))
        canvas?.requestRenderAll()
        onChange(props.fn(value !== props.value))
      }}
    >
      {props.icon}
    </button>
  )
}

export const updateFontFamily = async (font: string, canvas?: Canvas | null) => {
  var myfont = new FontFaceObserver(font)
  await myfont.load()
  if (!canvas) return
  // when font is loaded, use it.
  canvas.getActiveObject()?.set("fontFamily", font);
  canvas.requestRenderAll();
}