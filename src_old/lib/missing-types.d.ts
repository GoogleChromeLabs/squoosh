interface HTMLImageElement {
  decode: (() => Promise<void>) | undefined;
}

interface CanvasRenderingContext2D {
  imageSmoothingQuality: 'low' | 'medium' | 'high';
}
