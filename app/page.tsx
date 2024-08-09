"use client"

import clsx from "clsx";
import { Canvas, Textbox, FabricObject, FabricImage, loadSVGFromString } from "fabric";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState} from "react";
import FontFaceObserver from "fontfaceobserver"


export default function Home() {
  const [isSelecting, setSelecting] = useState<FabricObject>()
  const canvas = useRef<Canvas | null>(null);

  useEffect(() => {
    canvas.current = initCanvas();
    
    return () => {
      canvas.current?.dispose();
      canvas.current = null;
    };
  }, []);

  const initCanvas = () => (
    new Canvas('c', {
      height: 794,
      width: 1123,
      renderOnAddRemove: true,
      preserveObjectStacking: true,
    })
  );

  const handleAddText = (canvas: Canvas | null) => {
    const text = new Textbox('New text', {
      snapAngle: 45,
      snapThreshold: 1,
      editable: true,
      width: 200,
      fontSize: 20
    })
    text.on("selected", (e) => {
      setSelecting(e.target)
    })
    text.on("deselected", () => {
      setSelecting(undefined)
    })
    canvas?.add(text)
    canvas?.bringObjectToFront(text)
  }

  const handleAddImage = (e: ChangeEvent<HTMLInputElement>, canvas: Canvas | null) => {
    if (!e?.target?.files?.[0]) return
    const reader = new FileReader();
      reader.onloadend = () => {
        FabricImage.fromURL(reader.result as string)
          .then((output) => {
            output.on("selected", (e) => {
              setSelecting(e.target)
            })
            output.on("deselected", () => {
              setSelecting(undefined)
            })
            canvas?.add(output)
          })
      };
      reader.readAsDataURL(e.target.files[0]);
  }

  const handleDeleteObject = (obj: FabricObject | undefined, canvas: Canvas | null) => {
    if (!obj) return
    canvas?.remove(obj)
    setSelecting(undefined)
  }

  const handleExportSvg = (canvas: Canvas | null) => {
    if (!canvas) return

    const fontInjectScript = `<style>@import url('https://fonts.googleapis.com/css2?family=Mooli&amp;family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&amp;family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&amp;display=swap');</style>`

    const svgString = String(canvas.toSVG())
    const injectedSvg = svgString.replace('<defs>', `<defs>\n${fontInjectScript}`)
    const blob = new Blob([injectedSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'file.svg'
    a.click()
  }

  return (
    <div className="grid grid-cols-[0.25fr_1fr]">
      <div id="menu">
        <ul className="menu bg-base-200 rounded-lg rounded-r-none gap-1">
          <li><button className="btn btn-outline" onClick={() => handleAddText(canvas.current)}>Add Text</button></li>
          <li>
            <input
              id="inputImage"
              onChange={(e) => handleAddImage(e, canvas.current)}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              className="hidden"
              placeholder="Add image" />
            <label className="btn btn-outline" htmlFor="inputImage">Import Image (.png,.jpg,.svg)</label>
          </li>
          <li className="mt-2">
            <button
              className={clsx("btn btn-error", !isSelecting && "btn-disabled")}
              role="button"
              aria-disabled={!isSelecting ? "true" : "false"}
              onClick={() => {
                handleDeleteObject(isSelecting, canvas.current)
              }}
            >
              Delete Element
            </button>
          </li>
          <li><button className="btn btn-info" onClick={() => {
            handleExportSvg(canvas.current)
          }}>Export SVG</button></li>
        </ul>
        <div className="bg-base-200 rounded-l-lg rounded-r-none mt-2 text-primary w-[200px]">
          {isSelecting && <Configuration object={isSelecting} canvas={canvas.current} />}
        </div>
      </div>
      <div style={{width: '297mm', height: '210mm', background: 'white'}} id="canvas">
        <canvas id="c" />
      </div>
    </div>
  );
}

const Configuration = (props: { object?: FabricObject, canvas?: Canvas | null }) => {
  function loadAndUse(font: string) {
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
      });
  }


  if (!props.object) return null

  if (props.object instanceof Textbox) {
    return (
      <div className="card bg-base-100 w-full rounded-r-none rounded-l-lg">
        <div className="card-body">
          <h2 className="card-title font-mono">Textbox</h2>
          <div className="join">
            <button
              className="btn btn-outline btn-sm join-item"
              onClick={
                () => {
                  props.object?.set("fontWeight", (props.object as Textbox).fontWeight === "normal" ? "bold" : "normal")
                  props.canvas?.requestRenderAll()
                }
              }
            >
              <Bold size={20} />
            </button>
            <button
              className="btn btn-outline btn-sm join-item"
              onClick={
                () => {
                  props.object?.set("fontStyle", (props.object as Textbox).fontStyle === "normal" ? "italic" : "normal")
                  props.canvas?.requestRenderAll()
                }
              }
            >
              <Italic size={20} />
            </button>
            <button
              className="btn btn-outline btn-sm join-item"
              onClick={
                () => {
                  props.object?.set("underline", !(props.object as Textbox).underline)
                  props.canvas?.requestRenderAll()
                }
              }
            >
              <Underline size={20} />
            </button>
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
              <input type="number" className="grow w-full text-sm" value={props.object.fontSize} onChange={(e) => {
                props.canvas?.getActiveObject()?.set("fontSize", +e.target.value)
                props.canvas?.requestRenderAll()
              }} />
            </label>
            <select
              className="select select-bordered w-full join-item text-accent-content"
              value={props.object?.fontFamily}
              onChange={(e) => {
                loadAndUse(e.target.value)
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

  return null
}
