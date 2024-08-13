import React, { useState } from 'react'
import { Canvas } from 'fabric'
import {
  buttonDecorationBuilder,
  fontDecoration,
  getFontList,
  updateFontFamily,
} from '@/utils'
import { Trash2 } from 'lucide-react'

type TextboxComponent = { canvas?: Canvas | null; onDelete: () => void }

const TextboxComponent = (props: TextboxComponent) => {
  const [textBoxProperty, setTextBoxProperty] = useState(() => {
    const property = {
      fontWeight: props?.canvas?.getActiveObject()?.get('fontWeight'),
      fontStyle: props?.canvas?.getActiveObject()?.get('fontStyle'),
      underline: props?.canvas?.getActiveObject()?.get('underline'),
      textAlign: props?.canvas?.getActiveObject()?.get('textAlign'),
      fontSize: props?.canvas?.getActiveObject()?.get('fontSize'),
      fontFamily: props?.canvas?.getActiveObject()?.get('fontFamily'),
    }
    return property
  })

  return (
    <div className="card bg-base-100 w-full rounded-r-none rounded-l-lg">
      <div className="card-body p-2">
        <h2 className="card-title font-mono">
          {props.canvas?.getActiveObject()?.type}
        </h2>
        <div className="join grid grid-flow-col">
          {buttonDecorationBuilder(
            { ...fontDecoration['bold'] },
            textBoxProperty.fontWeight,
            (value) => {
              setTextBoxProperty((state) => ({ ...state, fontWeight: value }))
            },
            props.canvas,
          )}
          {buttonDecorationBuilder(
            { ...fontDecoration['italic'] },
            textBoxProperty.fontStyle,
            (value) => {
              setTextBoxProperty((state) => ({ ...state, fontStyle: value }))
            },
            props.canvas,
          )}
          {buttonDecorationBuilder(
            { ...fontDecoration['underline'] },
            textBoxProperty.underline,
            (value) => {
              setTextBoxProperty((state) => ({ ...state, underline: value }))
            },
            props.canvas,
          )}
        </div>
        <div className="join grid grid-flow-col">
          {buttonDecorationBuilder(
            { ...fontDecoration['textAlignLeft'] },
            textBoxProperty.textAlign,
            (value) => {
              setTextBoxProperty((state) => ({ ...state, textAlign: value }))
            },
            props.canvas,
          )}
          {buttonDecorationBuilder(
            { ...fontDecoration['textAlignCenter'] },
            textBoxProperty.textAlign,
            (value) => {
              setTextBoxProperty((state) => ({ ...state, textAlign: value }))
            },
            props.canvas,
          )}
          {buttonDecorationBuilder(
            { ...fontDecoration['textAlignRight'] },
            textBoxProperty.textAlign,
            (value) => {
              setTextBoxProperty((state) => ({ ...state, textAlign: value }))
            },
            props.canvas,
          )}
        </div>
        <div className="join join-vertical">
          <label className="input input-bordered flex items-center gap-2 join-item">
            <p className="text-sm whitespace-nowrap">Font size:</p>
            <input
              type="number"
              className="grow w-full text-sm"
              value={textBoxProperty['fontSize']}
              onChange={(e) => {
                const value = +e.target.value
                props.canvas?.getActiveObject()?.set('fontSize', value)
                props.canvas?.requestRenderAll()
                setTextBoxProperty((state) => ({ ...state, fontSize: value }))
              }}
            />
          </label>
          <select
            className="select select-bordered w-full join-item"
            value={textBoxProperty['fontFamily']}
            onChange={async (e) => {
              const value = e.target.value
              await updateFontFamily(value, props.canvas)
              setTextBoxProperty((state) => ({ ...state, fontFamily: value }))
            }}
          >
            <option value="Times New Roman">Times New Roman</option>
            {(getFontList() || []).map((value, index) => (
              <option key={index}>{value}</option>
            ))}
          </select>
        </div>
        <div>
          <button
            className="btn btn-error btn-block"
            onClick={() => {
              props.onDelete()
            }}
          >
            <Trash2 size={20} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default TextboxComponent
