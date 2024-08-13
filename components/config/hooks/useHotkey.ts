import { isMacOs } from 'react-device-detect'
import { HotkeyCallback, Keys, Options, useHotkeys } from 'react-hotkeys-hook'

export default function useHotKey(
  keys: Keys,
  callback: HotkeyCallback,
  options?: Options,
) {
  return useHotkeys(keys, callback, {
    ...options,
    enabled: (k, h) => {
      return (
        isMacOs &&
        !k.ctrlKey &&
        (typeof options?.enabled === 'boolean'
          ? options.enabled
          : options?.enabled?.(k, h) || true)
      )
    },
  })
}
