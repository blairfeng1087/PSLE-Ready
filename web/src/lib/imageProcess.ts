function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function processExamImage(blobUrl: string): Promise<string> {
  const img = await loadImage(blobUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.98);
}

export type Box2D = [number, number, number, number];

export async function cropFigure(blobUrl: string, box: Box2D): Promise<string> {
  const img = await loadImage(blobUrl);
  const pad = 40;
  const [yMin, xMin, yMax, xMax] = box;
  const x1 = Math.max(0, xMin - pad);
  const y1 = Math.max(0, yMin - pad);
  const x2 = Math.min(1000, xMax + pad);
  const y2 = Math.min(1000, yMax + pad);
  const sx = Math.round(img.width * x1 / 1000);
  const sy = Math.round(img.height * y1 / 1000);
  const sw = Math.round(img.width * (x2 - x1) / 1000);
  const sh = Math.round(img.height * (y2 - y1) / 1000);

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  canvas.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL("image/jpeg", 0.98);
}
