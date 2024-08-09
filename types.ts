import { FabricObject } from 'fabric'

interface ExtendedFabricObject {
  customId?: string
}

declare module 'fabric' {
  export interface FabricObject extends ExtendedFabricObject {}
}

export type SVGParsingOutput = {
  objects: (FabricObject | null)[]
  options: Record<string, any>
  elements: Element[]
  allElements: Element[]
}
