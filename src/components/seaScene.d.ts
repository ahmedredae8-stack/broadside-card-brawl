export function createSeaScene(canvas: HTMLCanvasElement, opt?: { params?: object | undefined }): {
  setScene(t: unknown): void; setShips(s: unknown): void; setParams(p: unknown): void; destroy(): void;
};
