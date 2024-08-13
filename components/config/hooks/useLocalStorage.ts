export function useLocalStorage() {
  const setLocalStorage = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value))
  }

  const getLocalStorage = (key: string) => {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  }

  return { setLocalStorage, getLocalStorage }
}
