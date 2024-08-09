import { FabricObject as FO } from "fabric";

declare module 'fabric' {
  export interface FabricObject extends FO {
    customId?: string;
  }
}
