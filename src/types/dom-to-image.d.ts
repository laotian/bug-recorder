declare module 'dom-to-image' {
  interface Options {
    filter?: (node: HTMLElement) => boolean;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: Record<string, any>;
    quality?: number;
    imagePlaceholder?: string;
    cacheBust?: boolean;
  }

  export function toPng(node: HTMLElement, options?: Options): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
  export function toSvg(node: HTMLElement, options?: Options): Promise<string>;
  export function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;
  export function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
}