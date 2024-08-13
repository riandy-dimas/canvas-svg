import LZString from 'lz-string'

export function useLocalStorage() {
  const setLocalStorage = (key: string, value: any) => {
    // to ensure storage size is not exceeded, we store only the last snapshot of each page
    const flatStack = value.map((pageStack: any) => {
      return {
        stackCursor: 0,
        snapshots: pageStack.snapshots.slice(-1),
      }
    })

    const compressedValue = LZString.compress(JSON.stringify(flatStack))
    localStorage.setItem(key, compressedValue)
  }

  const getLocalStorage = (key: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        const value = localStorage.getItem(key)
        const decompressedData = value && JSON.parse(LZString.decompress(value))
        console.log(decompressedData)
        console.log(
          `currentStackSize: `,
          getLocalStorageSize(key).sizeInKB,
          ` KB`,
        )
        resolve(decompressedData ? decompressedData : null)
      } catch (error) {
        reject(error)
      }
    })
  }

  function getLocalStorageSize(key: string) {
    let total = 0

    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage[key]
      total += key.length + value.length
    }

    const sizeInBytes = total * 2
    const sizeInKB = (sizeInBytes / 1024).toFixed(2)
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2)

    return { sizeInBytes, sizeInKB, sizeInMB }
  }

  return { setLocalStorage, getLocalStorage }
}
