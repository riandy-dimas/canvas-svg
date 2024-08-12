import { Canvas } from 'fabric'
import { useState } from 'react'

export const useCutCopyPaste = (canvas: Canvas | null) => {
  const [objectClipboard, setObjectClipboard] = useState<any>(null)

  const copy = async () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      const cloned = await activeObject.clone()

      setObjectClipboard(cloned)
    }
  }

  const cut = async () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      const cloned = await activeObject.clone()
      setObjectClipboard(cloned)
      await canvas.remove(activeObject)
    }
  }

  const paste = async () => {
    if (!canvas) return

    if (!objectClipboard) return
    await canvas?.add(objectClipboard)
    await canvas?.bringObjectToFront(objectClipboard)
    await canvas?.setActiveObject(objectClipboard)
  }

  const duplicate = async () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      const cloned = await activeObject.clone()
      await cloned.set({
        left: (activeObject.left || 0) + 10, // Adjust X position
        top: (activeObject.top || 0) + 10, // Adjust Y position
      })
      canvas.add(cloned)
      canvas.bringObjectToFront(cloned)
      canvas.setActiveObject(cloned)
    }
  }

  return { copy, cut, paste, duplicate }
}
