export type Orientation = 'auto' | 'portrait' | 'landscape';
export type Size = { width: number; height: number };
export type Calibration = { horizontal: number; vertical: number; edge: number };
export type Placement = { x: number; y: number; width: number; height: number; rotated: boolean };
export type SheetLayout = { width: number; height: number; capacity: number; placements: Placement[]; orientation: 'portrait' | 'landscape'; photoPixels: Size; marginPixels: number; gapPixels: number };
export const DPI = 300;
export const PAPER: Size = { width: 101.6, height: 152.4 };
export const DEFAULT_CALIBRATION: Calibration = { horizontal: 100, vertical: 100, edge: 3 };
export function mmToPixels(mm: number, dpi = DPI): number { return Math.round(mm / 25.4 * dpi); }
export function applyCalibration(size: Size, calibration: Calibration): Size {
  return { width: size.width * calibration.horizontal / 100, height: size.height * calibration.vertical / 100 };
}
type Candidate = { orientation: 'portrait' | 'landscape'; rotated: boolean; columns: number; rows: number; capacity: number; tileW: number; tileH: number; width: number; height: number; margin: number; gap: number };
export function calculatePassportLayout(input: { photo: Size; paper?: Size; copies: number; orientation?: Orientation; dpi?: number; gapMm?: number; calibration?: Calibration }): SheetLayout {
  const { photo, paper = PAPER, copies, orientation = 'auto', dpi = DPI, gapMm = 1.5, calibration = DEFAULT_CALIBRATION } = input;
  if (![photo.width, photo.height, paper.width, paper.height, copies, dpi, gapMm, calibration.edge].every(Number.isFinite) || photo.width <= 0 || photo.height <= 0 || copies < 1 || dpi <= 0 || gapMm < 0 || calibration.edge < 0 || calibration.horizontal <= 0 || calibration.vertical <= 0) throw new Error('Invalid sheet settings');
  const calibrated = applyCalibration(photo, calibration);
  const photoPixels = { width: mmToPixels(calibrated.width, dpi), height: mmToPixels(calibrated.height, dpi) };
  const gap = mmToPixels(gapMm, dpi), margin = mmToPixels(calibration.edge, dpi);
  const candidates: Candidate[] = [];
  for (const direction of (orientation === 'auto' ? ['portrait', 'landscape'] : [orientation]) as ('portrait' | 'landscape')[]) {
    const width = mmToPixels(direction === 'portrait' ? paper.width : paper.height, dpi);
    const height = mmToPixels(direction === 'portrait' ? paper.height : paper.width, dpi);
    for (const rotated of [false, true]) {
      const tileW = rotated ? photoPixels.height : photoPixels.width;
      const tileH = rotated ? photoPixels.width : photoPixels.height;
      const columns = Math.max(0, Math.floor((width - 2 * margin + gap) / (tileW + gap)));
      const rows = Math.max(0, Math.floor((height - 2 * margin + gap) / (tileH + gap)));
      candidates.push({ orientation: direction, rotated, columns, rows, capacity: columns * rows, tileW, tileH, width, height, margin, gap });
    }
  }
  candidates.sort((a, b) => b.capacity - a.capacity || Number(a.orientation !== 'portrait') - Number(b.orientation !== 'portrait') || Number(b.rotated) - Number(a.rotated));
  const best = candidates[0];
  if (!best || best.capacity < 1) throw new Error('Photo does not fit the paper with these margins');
  const count = Math.min(Math.floor(copies), best.capacity);
  const usedRows = Math.ceil(count / best.columns);
  const usedColumns = Math.min(count, best.columns);
  const blockW = usedColumns * best.tileW + (usedColumns - 1) * gap;
  const blockH = usedRows * best.tileH + (usedRows - 1) * gap;
  const startX = Math.floor((best.width - blockW) / 2);
  const startY = Math.floor((best.height - blockH) / 2);
  const placements: Placement[] = Array.from({ length: count }, (_, i) => ({ x: startX + (i % usedColumns) * (best.tileW + gap), y: startY + Math.floor(i / usedColumns) * (best.tileH + gap), width: best.tileW, height: best.tileH, rotated: best.rotated }));
  return { width: best.width, height: best.height, capacity: best.capacity, placements, orientation: best.orientation, photoPixels, marginPixels: margin, gapPixels: gap };
}
