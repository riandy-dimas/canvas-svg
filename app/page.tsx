"use client"

import clsx from "clsx";
import fabric, { Canvas, Textbox, FabricObject, FabricImage, loadSVGFromString, loadSVGFromURL, FabricText } from "fabric";
import { ChangeEvent, useEffect, useRef, useState} from "react";

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
      preserveObjectStacking: true
    })
  );

  const handleAddText = (canvas: Canvas | null) => {
    const text = new Textbox('New text', {
      snapAngle: 45,
      snapThreshold: 1,
      editable: true,
      width: 200
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
    // if file is svg then load it as svg string
    if (e.target.files[0].type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onloadend = () => {
        loadSVGFromString(reader.result as string).then((output) => {
          const {objects, elements} = output
          
          objects.forEach((obj, index) => {
            if (obj && obj.type === 'text') {
              const currentElement = elements[index]
              if (currentElement.children.length > 0 && currentElement.children[0].tagName === 'tspan') {
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
              text.on("selected", (e) => {
                setSelecting(e.target)
              })
              text.on("deselected", () => {
                setSelecting(undefined)
              })
              return canvas?.add(text);
            }
            obj && canvas?.add(obj);
          })
        })

        
      };
      reader.readAsText(e.target.files[0]);
      return
    } else {

    }
  }


  const handleExportSvg = (canvas: Canvas | null) => {
    if (!canvas) return
    const svgString = String(canvas.toSVG())

    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'file.svg'
    a.click()
  }

  

  return (
    <div className="grid grid-cols-[0.25fr_1fr] p-6">
      <div id="menu">
        <ul className="menu bg-base-200 rounded-lg rounded-r-none">
          <li><button className="btn" onClick={() => handleAddText(canvas.current)}>Add Text</button></li>
          <li>
            <input
              id="inputImage"
              onChange={(e) => handleAddImage(e, canvas.current)}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              className="hidden"
              placeholder="Add image" />
            <label className="btn" htmlFor="inputImage">Import Image (.png,.jpg,.svg)</label>
          </li>
          <li>
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
        <div className="bg-base-200 rounded-l-lg mt-2 text-primary">
          {isSelecting && <Configuration object={isSelecting} canvas={canvas.current} />}
        </div>
      </div>
      <div style={{width: '297mm', height: '210mm', background: 'white'}} id="canvas">
        <canvas id="c" />
      </div>
    </div>
  );
}







