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
      const isEnabled =
        typeof options?.enabled === 'boolean'
          ? options.enabled
          : (options?.enabled?.(k, h) ?? true)
      if (!isMacOs) return isEnabled
      return !k.ctrlKey && isEnabled
    },
  })
}
