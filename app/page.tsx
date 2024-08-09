"use client"

import clsx from "clsx";
import { Canvas, Textbox, FabricObject, FabricImage, loadSVGFromString } from "fabric";
import { ChangeEvent, useEffect, useRef, useState} from "react";
import TextboxComponent from "@/components/config/textbox";
import { updateFontFamily } from "@/components/config/utils";
import { nanoid } from "nanoid";


export default function Home() {
  const [selectedObject, setSelecting] = useState<FabricObject>()
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

  const handleAddText = async (canvas: Canvas | null) => {
    const text = new Textbox('New text', {
      snapAngle: 45,
      snapThreshold: 1,
      editable: true,
      width: 200,
      fontSize: 20,
      textAlign: 'left',
      fontFamily: 'Roboto',
      customId: nanoid(7)
    })
    text.on("selected", (e) => {
      setSelecting(e.target)
    })
    text.on("deselected", () => {
      setSelecting(undefined)
    })
    await updateFontFamily("Roboto", canvas)

    canvas?.add(text)
    canvas?.bringObjectToFront(text)
  }

  const handleAddImage = (e: ChangeEvent<HTMLInputElement>, canvas: Canvas | null) => {
    if (!e?.target?.files?.[0]) return
    const reader = new FileReader();
      reader.onloadend = () => {
        FabricImage.fromURL(reader.result as string, undefined, { customId: nanoid(7) })
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

  const handleDeleteObject = (canvas: Canvas | null) => {
    const object = canvas?.getActiveObject()!
    canvas?.remove(object)
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
              className={clsx("btn btn-error", !selectedObject && "btn-disabled")}
              role="button"
              aria-disabled={!selectedObject ? "true" : "false"}
              onClick={() => {
                handleDeleteObject(canvas.current)
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
          <Configuration key={selectedObject?.customId} object={selectedObject} canvas={canvas.current} />
        </div>
      </div>
      <div style={{width: '297mm', height: '210mm', background: 'white'}} id="canvas">
        <canvas id="c" />
      </div>
    </div>
  );
}

const Configuration = (props: { object?: FabricObject, canvas?: Canvas | null }) => {
  if (!props.object) return null
  if (props.object instanceof Textbox) {
    return <TextboxComponent key={props.object.customId} canvas={props?.canvas} />
  }
  return null
}
