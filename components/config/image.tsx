import { Canvas } from 'fabric'
import { Trash2 } from 'lucide-react'
import React from 'react'

type ImageComponent = {
  canvas?: Canvas | null
  onDelete: () => void
}

const ImageComponent = (props: ImageComponent) => {
  console.log('xxx', props.canvas?.getActiveObject())
  return (
    <div className="card bg-base-100 w-full rounded-r-none rounded-l-lg">
      <div className="card-body p-2">
        <h2 className="card-title font-mono">
          {props.canvas?.getActiveObject()?.type}
        </h2>
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

export default ImageComponent
