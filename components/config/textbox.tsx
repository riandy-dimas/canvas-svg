import React, { useState } from 'react'
import { Canvas, FabricObject, Textbox } from 'fabric'
import FontFaceObserver from "fontfaceobserver"
import { buttonDecorationBuilder, fontDecoration, updateFontFamily } from './utils'

type TextboxComponent = { object?: FabricObject<Textbox>, canvas?: Canvas | null }

const TextboxComponent = (props: TextboxComponent) => {
  const [textBoxProperty, setTextBoxProperty] = useState(() => {
    const property = {
      fontWeight: props?.object?.get("fontWeight"),
      fontStyle: props?.object?.get("fontStyle"),
      underline: props?.object?.get("underline"),
      textAlign: props?.object?.get("textAlign"),
      fontSize: props?.object?.get("fontSize"),
      fontFamily: props?.object?.get("fontFamily")
    }
    return property
  })

  return (
    <div className="card bg-base-100 w-full rounded-r-none rounded-l-lg">
      <div className="card-body">
        <h2 className="card-title font-mono">Textbox</h2>
        <div className="join">
          {buttonDecorationBuilder({...fontDecoration['bold']}, textBoxProperty.fontWeight, (value) => { setTextBoxProperty((state) => ({...state, fontWeight: value})) }, props.canvas)}
          {buttonDecorationBuilder({...fontDecoration['italic']}, textBoxProperty.fontStyle, (value) => { setTextBoxProperty((state) => ({...state, fontStyle: value})) }, props.canvas)}
          {buttonDecorationBuilder({...fontDecoration['underline']}, textBoxProperty.underline, (value) => { setTextBoxProperty((state) => ({...state, underline: value})) }, props.canvas)}
        </div>
        <div className="join">
          {buttonDecorationBuilder({...fontDecoration['textAlignLeft']}, textBoxProperty.textAlign, (value) => { setTextBoxProperty((state) => ({...state, textAlign: value})) }, props.canvas)}
          {buttonDecorationBuilder({...fontDecoration['textAlignCenter']}, textBoxProperty.textAlign, (value) => { setTextBoxProperty((state) => ({...state, textAlign: value})) }, props.canvas)}
          {buttonDecorationBuilder({...fontDecoration['textAlignRight']}, textBoxProperty.textAlign, (value) => { setTextBoxProperty((state) => ({...state, textAlign: value})) }, props.canvas)}
        </div>
        <div className="join join-vertical">
          <label className="input input-bordered flex items-center gap-2 join-item">
            <p className="text-sm whitespace-nowrap">Font size:</p>
            <input type="number" className="grow w-full text-sm" value={textBoxProperty['fontSize']} onChange={(e) => {
              const value = +e.target.value
              props.canvas?.getActiveObject()?.set("fontSize", value)
              props.canvas?.requestRenderAll()
              setTextBoxProperty((state) => ({...state, fontSize: value}))
            }} />
          </label>
          <select
            className="select select-bordered w-full join-item"
            value={textBoxProperty['fontFamily']}
            onChange={async (e) => {
              const value = e.target.value
              await updateFontFamily(value, props.canvas)
              setTextBoxProperty((state) => ({...state, fontFamily: value}))
            }}
          >
            <option value={"Roboto"}>Roboto</option>
            <option value={"Poppins"}>Poppins</option>
            <option value={"Mooli"}>Mooli</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default TextboxComponent