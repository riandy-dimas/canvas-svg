import React, { useState } from 'react'
import { Canvas, FabricObject, Textbox } from 'fabric'
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from 'lucide-react'
import { buttonDecorationBuilder, fontDecoration } from './utils'

type TextboxComponent = { object?: FabricObject<Textbox>, canvas?: Canvas | null }

const TextboxComponent = (props: TextboxComponent) => {
  const [textBoxProperty, setTextBoxProperty] = useState(() => {
    const property = {
      fontWeight: props?.object?.get("fontWeight"),
      fontStyle: props?.object?.get("fontStyle"),
      underline: props?.object?.get("underline"),
    }
    return property
  })
  const updateFontFamily = (font: string) => {
    var myfont = new FontFaceObserver(font)
    myfont.load()
      .then(function() {
        if (!props.canvas) return
        // when font is loaded, use it.
        props.canvas.getActiveObject()?.set("fontFamily", font);
        props.canvas.requestRenderAll();
        
      }).catch(function(e) {
        console.log(e)
        alert('font loading failed ' + font);
      })
    }
      
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
          <button
            className="btn btn-outline btn-sm join-item"
            onClick={
              () => {
                props.object?.set("textAlign", "left")
                props.canvas?.requestRenderAll()
              }
            }
          >
            <AlignLeft size={20} />
          </button>
          <button
            className="btn btn-outline btn-sm join-item"
            onClick={
              () => {
                props.object?.set("textAlign", "center")
                props.canvas?.requestRenderAll()
              }
            }
          >
            <AlignCenter size={20} />
          </button>
          <button
            className="btn btn-outline btn-sm join-item"
            onClick={
              () => {
                props.object?.set("textAlign", "right")
                props.canvas?.requestRenderAll()
              }
            }
          >
            <AlignRight size={20} />
          </button>
        </div>
        <div className="join join-vertical">
          <label className="input input-bordered flex items-center gap-2 join-item text-accent-content">
            <p className="text-sm whitespace-nowrap">Font size:</p>
            <input type="number" className="grow w-full text-sm" value={props.object?.fontSize} onChange={(e) => {
              props.canvas?.getActiveObject()?.set("fontSize", +e.target.value)
              props.canvas?.requestRenderAll()
            }} />
          </label>
          <select
            className="select select-bordered w-full join-item text-accent-content"
            value={props.object?.fontFamily}
            onChange={(e) => {
              updateFontFamily(e.target.value)
            }}
          >
            <option disabled>Select font type</option>
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