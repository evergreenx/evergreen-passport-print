import type { SheetLayout, Size, Calibration } from './layout';
import { calculatePassportLayout, mmToPixels, PAPER } from './layout';
export type Crop = { x: number; y: number; zoom: number; rotation: number };
export function drawCrop(ctx: CanvasRenderingContext2D, image: ImageBitmap, output: Size, crop: Crop) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.save(); ctx.translate(width / 2, height / 2);
  ctx.rotate(crop.rotation * Math.PI / 180);
  const turned = crop.rotation % 180 !== 0;
  const visibleW = turned ? height : width, visibleH = turned ? width : height;
  const scale = Math.max(visibleW / image.width, visibleH / image.height) * crop.zoom;
  const maxX = Math.max(0, (image.width - visibleW / scale) / 2);
  const maxY = Math.max(0, (image.height - visibleH / scale) / 2);
  const x = Math.max(-maxX, Math.min(maxX, crop.x));
  const y = Math.max(-maxY, Math.min(maxY, crop.y));
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, -image.width * scale / 2 + x * scale, -image.height * scale / 2 + y * scale, image.width * scale, image.height * scale);
  ctx.restore();
}
export function generatePassportSheet(image: ImageBitmap, crop: Crop, layout: SheetLayout, cuttingGuides = false, scale = 1): HTMLCanvasElement {
  const tile = document.createElement('canvas'); tile.width = Math.round(layout.photoPixels.width * scale); tile.height = Math.round(layout.photoPixels.height * scale);
  const tileCtx = tile.getContext('2d', { alpha: false }); if (!tileCtx) throw new Error('Canvas unavailable');
  drawCrop(tileCtx, image, layout.photoPixels, crop);
  const sheet = document.createElement('canvas'); sheet.width = Math.round(layout.width * scale); sheet.height = Math.round(layout.height * scale);
  const ctx = sheet.getContext('2d', { alpha: false }); if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sheet.width, sheet.height);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  for (const p of layout.placements) {
    if (p.rotated) { ctx.save(); ctx.translate((p.x + p.width) * scale, p.y * scale); ctx.rotate(Math.PI / 2); ctx.drawImage(tile, 0, 0, p.height * scale, p.width * scale); ctx.restore(); }
    else ctx.drawImage(tile, p.x * scale, p.y * scale, p.width * scale, p.height * scale);
    if (cuttingGuides) { ctx.strokeStyle = '#777'; ctx.lineWidth = 1; ctx.strokeRect(p.x * scale + .5, p.y * scale + .5, p.width * scale - 1, p.height * scale - 1); }
  }
  return sheet;
}
export function generateCalibrationTest(calibration: Calibration): HTMLCanvasElement {
  const layout = calculatePassportLayout({ photo: { width: 35, height: 45 }, copies: 1, orientation: 'portrait', calibration });
  const canvas = document.createElement('canvas'); canvas.width = layout.width; canvas.height = layout.height;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const marks = [{ width: 35, height: 45, label: '35 × 45 mm' }, { width: 50, height: 50, label: '50 × 50 mm' }];
  let y = mmToPixels(15);
  for (const mark of marks) {
    const w = mmToPixels(mark.width * calibration.horizontal / 100), h = mmToPixels(mark.height * calibration.vertical / 100);
    const x = Math.round((canvas.width - w) / 2);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#000'; ctx.font = '26px sans-serif'; ctx.fillText(mark.label, x, y - 10);
    y += h + mmToPixels(18);
  }
  ctx.font = '22px sans-serif'; ctx.fillText('Print as one 4 × 6 image. Measure the rectangles.', mmToPixels(7), canvas.height - mmToPixels(10));
  return canvas;
}
export function exportSheet(canvas: HTMLCanvasElement, format: 'jpeg' | 'png'): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not export image')), `image/${format}`, format === 'jpeg' ? 0.99 : undefined));
}
export function saveBlob(blob: Blob, extension: string) {
  const now = new Date(); const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `evergreen-passport-${stamp}.${extension}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
