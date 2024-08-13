import { isMacOs } from 'react-device-detect'
import { HotkeyCallback, Keys, Options, useHotkeys } from 'react-hotkeys-hook'

export default function useHotKey(
  keys: Keys,
  callback: HotkeyCallback,
  options?: Options,
) {
  return useHotkeys(keys, callback, {
    ...options,
    enabled: (...args) => {
      const isEnabled =
        typeof options?.enabled === 'boolean'
          ? options.enabled
          : (options?.enabled?.(...args) ?? true)
      args[0].preventDefault()
      if (!isMacOs) return isEnabled
      return !args[0].ctrlKey && isEnabled
    },
  })
}
