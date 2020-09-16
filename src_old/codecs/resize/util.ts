export function getContainOffsets(
  sw: number,
  sh: number,
  dw: number,
  dh: number,
) {
  const currentAspect = sw / sh;
  const endAspect = dw / dh;

  if (endAspect > currentAspect) {
    const newSh = sw / endAspect;
    const newSy = (sh - newSh) / 2;
    return { sw, sh: newSh, sx: 0, sy: newSy };
  }

  const newSw = sh * endAspect;
  const newSx = (sw - newSw) / 2;
  return { sh, sw: newSw, sx: newSx, sy: 0 };
}
