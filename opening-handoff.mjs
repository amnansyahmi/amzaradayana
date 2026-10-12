export function planHandoff({ cameraZ, openedScale, cardWidth, paperHeight, viewportHeight,
  nameCenterY, nameFontSize }) {
  const printedNamePixels = 135 * cardWidth / 768;
  const targetScale = Math.max(.9, Math.min(1.18, nameFontSize / printedNamePixels));
  const cameraFactor = openedScale / targetScale;
  const units = 2.8 / cardWidth * cameraFactor;
  const textY = paperHeight * (.5 - 410 / 1064) * openedScale;
  return { cameraZ: cameraZ * cameraFactor,
    paperY: -(nameCenterY - viewportHeight / 2) * units - textY };
}

export function planCSSHandoff({ cardWidth, cardHeight, viewportHeight, nameCenterY, nameFontSize }) {
  const scale = Math.max(.9, Math.min(1.18, nameFontSize / (135 * cardWidth / 768)));
  return { scale, y: nameCenterY - viewportHeight / 2 - cardHeight * (410 / 1064 - .5) * scale };
}
