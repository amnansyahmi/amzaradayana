// At the final pose, all four paper corners project onto the real greeting.
// Coordinates are relative to the cover, not an assumed phone/screen size.
export function planHandoff({ cameraZ, openedScale, cardWidth, cardHeight,
  viewportWidth, viewportHeight, targetLeft, targetTop, targetWidth, targetHeight }) {
  const cameraFactor = openedScale * cardWidth / targetWidth;
  const units = 2.8 / cardWidth * cameraFactor;
  return {
    cameraZ: cameraZ * cameraFactor,
    paperX: (targetLeft + targetWidth / 2 - viewportWidth / 2) * units,
    paperY: -(targetTop + targetHeight / 2 - viewportHeight / 2) * units,
    aspectScale: (targetHeight / targetWidth) / (cardHeight / cardWidth)
  };
}
