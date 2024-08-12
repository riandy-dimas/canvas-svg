import { Canvas } from 'fabric'
import { useEffect } from 'react'

type KeyStrokeConfig = {
  [key: string]: (args?: any) => void
}

// TODO: add the rest keybinding if needed
const PREVENT_DEFAULT_KEY = ['d']

// TODO: currently only supporting 'ctrl' modifier, and 'shift' and second modifier
export const useKeystrokeListener = (
  canvas: Canvas | null,
  KEY_CONFIG: KeyStrokeConfig,
) => {
  useEffect(() => {
    if (!canvas) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.ctrlKey &&
        PREVENT_DEFAULT_KEY.includes(event.key.toLowerCase())
      ) {
        event.preventDefault()
      }

      const pressedKey = event.key.toLowerCase()
      const pressedModifier = event.ctrlKey

      const getKeysOfConfig = Object.keys(KEY_CONFIG)

      getKeysOfConfig.forEach(async (key) => {
        const keyIsCombination = key.includes('+')

        if (keyIsCombination) {
          const isShift = event.shiftKey
          const [_, mainKey, secondaryKey] = key.split('+')
          const actualLastKey = isShift ? secondaryKey : mainKey

          if (pressedModifier && actualLastKey === pressedKey) {
            await KEY_CONFIG[key]()
          }
        } else {
          key === pressedKey && (await KEY_CONFIG[key](canvas))
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canvas, KEY_CONFIG])
}
