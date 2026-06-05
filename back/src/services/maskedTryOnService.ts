import sharp from 'sharp';

type RgbaImage = {
  data: Buffer;
  height: number;
  width: number;
};

type Box = {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
};

type MaskComponent = Box & {
  area: number;
  pixels: number[];
};

type StyleReference = {
  components: MaskComponent[];
  image: RgbaImage;
  mask: Uint8Array;
  palette: Array<[number, number, number]>;
};

type GenerateMaskedTryOnImageInput = {
  handImageUrl: string;
  styleImageUrl: string;
  styleName?: string;
  styleTags?: string[];
};

const MAX_IMAGE_EDGE = 1536;
const MIN_COMPONENT_AREA = 18;

const clamp = (value: number, min = 0, max = 255) => Math.max(min, Math.min(max, Math.round(value)));

const getImageBuffer = async (image: string) => {
  const dataUrlMatch = image.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (dataUrlMatch?.[1]) {
    return Buffer.from(dataUrlMatch[1], 'base64');
  }

  if (!/^https?:\/\//.test(image)) {
    throw new Error('Only data URL and HTTP image URL are supported');
  }

  const response = await fetch(image);
  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
};

const loadRgbaImage = async (image: string, resize = true): Promise<RgbaImage> => {
  const buffer = await getImageBuffer(image);
  const pipeline = sharp(buffer).rotate();
  const metadata = await pipeline.metadata();
  const shouldResize = resize && Math.max(metadata.width ?? 0, metadata.height ?? 0) > MAX_IMAGE_EDGE;
  const normalized = shouldResize
    ? pipeline.resize({
        fit: 'inside',
        height: MAX_IMAGE_EDGE,
        width: MAX_IMAGE_EDGE,
        withoutEnlargement: true,
      })
    : pipeline;
  const { data, info } = await normalized.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  return {
    data,
    height: info.height,
    width: info.width,
  };
};

const rgbToHsv = (r: number, g: number, b: number) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === rn) {
      hue = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      hue = (bn - rn) / delta + 2;
    } else {
      hue = (rn - gn) / delta + 4;
    }
  }

  return {
    hue: Math.round(hue * 60 + (hue < 0 ? 360 : 0)),
    saturation: max === 0 ? 0 : delta / max,
    value: max,
  };
};

const isSkinLike = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return r > 70 && g > 40 && b > 25 && max - min > 12 && r >= g * 0.92 && r >= b * 1.08 && g >= b * 0.72;
};

const getSkinBox = ({ data, height, width }: RgbaImage): Box | null => {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let count = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (!isSkinLike(data[offset], data[offset + 1], data[offset + 2])) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      count += 1;
    }
  }

  return count > width * height * 0.015 ? { maxX, maxY, minX, minY } : null;
};

const isLikelyOldNailPixel = ({ b, g, inFingerZone, r }: { b: number; g: number; inFingerZone: boolean; r: number }) => {
  const hsv = rgbToHsv(r, g, b);
  const colorfulPolish = inFingerZone && hsv.saturation > 0.26 && hsv.value > 0.34 && !isSkinLike(r, g, b);
  const coolPolish = inFingerZone && b > r * 1.08 && hsv.saturation > 0.18 && hsv.value > 0.42;
  const brightFrenchOrPearl = inFingerZone && hsv.saturation < 0.2 && hsv.value > 0.84 && Math.abs(r - g) < 28;
  const darkPolish = inFingerZone && hsv.value < 0.3 && hsv.saturation > 0.1;

  return colorfulPolish || coolPolish || brightFrenchOrPearl || darkPolish;
};

const collectComponents = (mask: Uint8Array, width: number, height: number): MaskComponent[] => {
  const visited = new Uint8Array(mask.length);
  const components: MaskComponent[] = [];
  const queue: number[] = [];

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) {
      continue;
    }

    visited[start] = 1;
    queue.length = 0;
    queue.push(start);

    const pixels: number[] = [];
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let head = 0; head < queue.length; head += 1) {
      const index = queue[head];
      const x = index % width;
      const y = Math.floor(index / width);
      pixels.push(index);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      const neighbors = [index - 1, index + 1, index - width, index + width];
      for (const next of neighbors) {
        if (next < 0 || next >= mask.length || visited[next] || !mask[next]) {
          continue;
        }

        const nextX = next % width;
        if (Math.abs(nextX - x) > 1) {
          continue;
        }

        visited[next] = 1;
        queue.push(next);
      }
    }

    components.push({
      area: pixels.length,
      maxX,
      maxY,
      minX,
      minY,
      pixels,
    });
  }

  return components;
};

const dilateMask = (mask: Uint8Array, width: number, height: number, radius: number) => {
  const output = new Uint8Array(mask.length);
  const offsets: Array<[number, number]> = [];
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (dx * dx + dy * dy <= radius * radius) {
        offsets.push([dx, dy]);
      }
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!mask[index]) {
        continue;
      }

      for (const [dx, dy] of offsets) {
        const nextX = x + dx;
        const nextY = y + dy;
        if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
          output[nextY * width + nextX] = 255;
        }
      }
    }
  }

  return output;
};

const createNailMask = (image: RgbaImage) => {
  const { data, height, width } = image;
  const skinBox = getSkinBox(image);
  const candidate = new Uint8Array(width * height);

  const box = skinBox ?? { maxX: width - 1, maxY: height - 1, minX: 0, minY: 0 };
  const boxWidth = Math.max(1, box.maxX - box.minX);
  const boxHeight = Math.max(1, box.maxY - box.minY);
  const expanded = {
    maxX: Math.min(width - 1, Math.round(box.maxX + boxWidth * 0.08)),
    maxY: Math.min(height - 1, Math.round(box.maxY + boxHeight * 0.04)),
    minX: Math.max(0, Math.round(box.minX - boxWidth * 0.08)),
    minY: Math.max(0, Math.round(box.minY - boxHeight * 0.08)),
  };

  for (let y = expanded.minY; y <= expanded.maxY; y += 1) {
    for (let x = expanded.minX; x <= expanded.maxX; x += 1) {
      const index = y * width + x;
      const offset = index * 4;
      const fingerZoneY = (y - box.minY) / boxHeight;
      const inFingerZone = fingerZoneY >= -0.04 && fingerZoneY <= 0.54;
      if (inFingerZone && isLikelyOldNailPixel({ b: data[offset + 2], g: data[offset + 1], inFingerZone, r: data[offset] })) {
        candidate[index] = 255;
      }
    }
  }

  const maxArea = width * height * 0.018;
  const maxComponentWidth = width * 0.22;
  const maxComponentHeight = height * 0.2;
  const components = collectComponents(candidate, width, height)
    .filter((component) => {
      const componentWidth = component.maxX - component.minX + 1;
      const componentHeight = component.maxY - component.minY + 1;
      return (
        component.area >= MIN_COMPONENT_AREA &&
        component.area <= maxArea &&
        componentWidth <= maxComponentWidth &&
        componentHeight <= maxComponentHeight
      );
    })
    .sort((a, b) => b.area - a.area)
    .slice(0, 8);

  const rawMask = new Uint8Array(width * height);
  for (const component of components) {
    for (const pixel of component.pixels) {
      rawMask[pixel] = 255;
    }
  }

  if (components.length < 2) {
    throw new Error(`Nail mask detection found only ${components.length} reliable nail area(s)`);
  }

  const mask = dilateMask(rawMask, width, height, Math.max(1, Math.round(Math.max(width, height) / 420)));

  return {
    components: collectComponents(mask, width, height).filter((component) => component.area >= MIN_COMPONENT_AREA),
    detectionMode: 'color-component',
    mask,
  };
};

const colorDistance = (a: [number, number, number], b: [number, number, number]) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

const isLikelyStyleDesignPixel = (r: number, g: number, b: number) => {
  const hsv = rgbToHsv(r, g, b);
  const likelyWhiteBackground = hsv.value > 0.92 && hsv.saturation < 0.12;
  const likelySkin = isSkinLike(r, g, b) && hsv.saturation < 0.42;
  const colorfulDesign = hsv.saturation > 0.18 && hsv.value > 0.18;
  const darkDesign = hsv.value < 0.34 && hsv.saturation > 0.04;
  const pearlDesign = hsv.value > 0.72 && hsv.saturation < 0.22 && !likelyWhiteBackground;

  return !likelyWhiteBackground && !likelySkin && (colorfulDesign || darkDesign || pearlDesign);
};

const extractStylePaletteFromImage = (styleImage: RgbaImage) => {
  const bins = new Map<string, { color: [number, number, number]; count: number }>();

  for (let index = 0; index < styleImage.width * styleImage.height; index += 3) {
    const offset = index * 4;
    const r = styleImage.data[offset];
    const g = styleImage.data[offset + 1];
    const b = styleImage.data[offset + 2];
    if (!isLikelyStyleDesignPixel(r, g, b)) {
      continue;
    }

    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    const existing = bins.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      bins.set(key, { color: [clamp(qr), clamp(qg), clamp(qb)], count: 1 });
    }
  }

  const palette: Array<[number, number, number]> = [];
  for (const item of [...bins.values()].sort((a, b) => b.count - a.count)) {
    if (palette.every((color) => colorDistance(color, item.color) > 80)) {
      palette.push(item.color);
    }
    if (palette.length >= 6) {
      break;
    }
  }

  return palette.length ? palette : ([[28, 28, 30], [197, 52, 58], [246, 238, 229]] as Array<[number, number, number]>);
};

const extractStyleReference = async (styleImageUrl: string): Promise<StyleReference> => {
  const image = await loadRgbaImage(styleImageUrl, true);
  const candidateMask = new Uint8Array(image.width * image.height);

  for (let index = 0; index < candidateMask.length; index += 1) {
    const offset = index * 4;
    if (isLikelyStyleDesignPixel(image.data[offset], image.data[offset + 1], image.data[offset + 2])) {
      candidateMask[index] = 255;
    }
  }

  const maxArea = image.width * image.height * 0.06;
  const maxWidth = image.width * 0.38;
  const maxHeight = image.height * 0.38;
  const components = collectComponents(candidateMask, image.width, image.height)
    .filter((component) => {
      const componentWidth = component.maxX - component.minX + 1;
      const componentHeight = component.maxY - component.minY + 1;
      return component.area > 12 && component.area < maxArea && componentWidth < maxWidth && componentHeight < maxHeight;
    })
    .sort((a, b) => a.minX - b.minX)
    .slice(0, 10);

  return {
    components,
    image,
    mask: candidateMask,
    palette: extractStylePaletteFromImage(image),
  };
};

const lighten = ([r, g, b]: [number, number, number], amount: number): [number, number, number] => [
  clamp(r + (255 - r) * amount),
  clamp(g + (255 - g) * amount),
  clamp(b + (255 - b) * amount),
];

const blendColor = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  clamp(a[0] * (1 - t) + b[0] * t),
  clamp(a[1] * (1 - t) + b[1] * t),
  clamp(a[2] * (1 - t) + b[2] * t),
];

const hasDarkRedContrast = (palette: Array<[number, number, number]>) => {
  const hasDark = palette.some(([r, g, b]) => r + g + b < 150);
  const hasRed = palette.some(([r, g, b]) => r > 120 && r > g * 1.25 && r > b * 1.15);
  return hasDark && hasRed;
};

const strengthenPalette = (palette: Array<[number, number, number]>, styleText: string) => {
  const nextPalette = [...palette];
  if (/黑|棋盘|格|甜酷/.test(styleText) && !nextPalette.some(([r, g, b]) => r + g + b < 120)) {
    nextPalette.unshift([18, 18, 22]);
  }

  if (/红|玫|爱心|丝带/.test(styleText) && !nextPalette.some(([r, g, b]) => r > 140 && r > g * 1.25 && r > b * 1.15)) {
    nextPalette.unshift([205, 36, 52]);
  }

  return nextPalette;
};

const synthesizeStyleLayer = ({
  components,
  height,
  mask,
  original,
  styleReference,
  styleName = '',
  styleTags = [],
  width,
}: {
  components: MaskComponent[];
  height: number;
  mask: Uint8Array;
  original: Buffer;
  styleReference: StyleReference;
  styleName?: string;
  styleTags?: string[];
  width: number;
}) => {
  const layer = Buffer.from(original);
  const styleText = `${styleName} ${styleTags.join(' ')}`;
  const stylePalette = strengthenPalette(styleReference.palette, styleText);
  const shouldUseChecker = hasDarkRedContrast(stylePalette) || /格|棋盘|甜酷|黑|红/.test(styleText);
  const sourceComponents = styleReference.components.length ? styleReference.components : [];

  const sampleSourceComponent = (componentIndex: number, localX: number, localY: number): [number, number, number] | null => {
    const source = sourceComponents[componentIndex % sourceComponents.length];
    if (!source) {
      return null;
    }

    const sourceX = Math.min(source.maxX, Math.max(source.minX, Math.round(source.minX + localX * Math.max(1, source.maxX - source.minX))));
    const sourceY = Math.min(source.maxY, Math.max(source.minY, Math.round(source.minY + localY * Math.max(1, source.maxY - source.minY))));
    const sourceIndex = sourceY * styleReference.image.width + sourceX;
    const offset = sourceIndex * 4;

    if (!styleReference.mask[sourceIndex]) {
      const fallbackPixel = source.pixels[
        (Math.floor(localX * 19) + Math.floor(localY * 29) + componentIndex * 11) % Math.max(1, source.pixels.length)
      ];
      if (fallbackPixel === undefined) {
        return null;
      }

      const fallbackOffset = fallbackPixel * 4;
      return [
        styleReference.image.data[fallbackOffset],
        styleReference.image.data[fallbackOffset + 1],
        styleReference.image.data[fallbackOffset + 2],
      ];
    }

    return [styleReference.image.data[offset], styleReference.image.data[offset + 1], styleReference.image.data[offset + 2]];
  };

  components
    .sort((a, b) => a.minX - b.minX)
    .forEach((component, componentIndex) => {
      const componentWidth = Math.max(1, component.maxX - component.minX + 1);
      const componentHeight = Math.max(1, component.maxY - component.minY + 1);
      const primary = stylePalette[componentIndex % stylePalette.length];
      const secondary = stylePalette[(componentIndex + 1) % stylePalette.length] ?? primary;
      const accent = stylePalette[(componentIndex + 2) % stylePalette.length] ?? lighten(primary, 0.45);

      for (const pixel of component.pixels) {
        if (!mask[pixel]) {
          continue;
        }

        const x = pixel % width;
        const y = Math.floor(pixel / width);
        const localX = (x - component.minX) / componentWidth;
        const localY = (y - component.minY) / componentHeight;
        const offset = pixel * 4;
        const shine = Math.max(0, 1 - Math.abs(localX - 0.38) * 6) * Math.max(0, 1 - localY * 1.25) * 0.24;
        let color = blendColor(primary, secondary, localY * 0.35);

        if (shouldUseChecker && componentIndex % 2 === 1) {
          const cell = Math.max(4, Math.round(Math.min(componentWidth, componentHeight) / 3));
          const checker = (Math.floor((x - component.minX) / cell) + Math.floor((y - component.minY) / cell)) % 2 === 0;
          color = checker ? primary : secondary;
        } else if (/法式|边/.test(styleText) && localY < 0.28) {
          color = lighten(secondary, 0.35);
        } else if (/渐|猫眼|流沙|水光/.test(styleText)) {
          color = blendColor(primary, secondary, Math.min(1, localY * 0.8 + localX * 0.22));
        }

        if ((componentIndex + Math.floor(localX * 7) + Math.floor(localY * 9)) % 17 === 0 && /钻|闪|亮片|金箔|星/.test(styleText)) {
          color = lighten(accent, 0.55);
        }

        color = sampleSourceComponent(componentIndex, localX, localY) ?? color;
        color = lighten(color, shine);
        const polishOpacity = 0.98;
        layer[offset] = clamp(color[0] * polishOpacity + original[offset] * (1 - polishOpacity));
        layer[offset + 1] = clamp(color[1] * polishOpacity + original[offset + 1] * (1 - polishOpacity));
        layer[offset + 2] = clamp(color[2] * polishOpacity + original[offset + 2] * (1 - polishOpacity));
        layer[offset + 3] = 255;
      }
    });

  return layer;
};

const compositeWithOriginal = ({
  generatedLayer,
  mask,
  original,
}: {
  generatedLayer: Buffer;
  mask: Uint8Array;
  original: Buffer;
}) => {
  const final = Buffer.alloc(original.length);

  for (let index = 0; index < mask.length; index += 1) {
    const alpha = mask[index] / 255;
    const offset = index * 4;
    final[offset] = clamp(generatedLayer[offset] * alpha + original[offset] * (1 - alpha));
    final[offset + 1] = clamp(generatedLayer[offset + 1] * alpha + original[offset + 1] * (1 - alpha));
    final[offset + 2] = clamp(generatedLayer[offset + 2] * alpha + original[offset + 2] * (1 - alpha));
    final[offset + 3] = original[offset + 3];
  }

  return final;
};

const getImageDiagnostics = ({ final, mask, original }: { final: Buffer; mask: Uint8Array; original: Buffer }) => {
  let maskPixels = 0;
  let changedPixels = 0;

  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4;
    const changed =
      Math.abs(final[offset] - original[offset]) + Math.abs(final[offset + 1] - original[offset + 1]) + Math.abs(final[offset + 2] - original[offset + 2]);

    if (mask[index] > 0) {
      maskPixels += 1;
    }

    if (changed > 18) {
      changedPixels += 1;
    }
  }

  return {
    changedPixelRatio: Number((changedPixels / mask.length).toFixed(5)),
    maskCoverage: Number((maskPixels / mask.length).toFixed(5)),
  };
};

const rawRgbaToPngDataUrl = async (data: Buffer, width: number, height: number) => {
  const png = await sharp(data, {
    raw: {
      channels: 4,
      height,
      width,
    },
  })
    .png()
    .toBuffer();

  return `data:image/png;base64,${png.toString('base64')}`;
};

const maskToPngDataUrl = async (mask: Uint8Array, width: number, height: number) => {
  const rgba = Buffer.alloc(width * height * 4);
  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4;
    rgba[offset] = 255;
    rgba[offset + 1] = 255;
    rgba[offset + 2] = 255;
    rgba[offset + 3] = mask[index];
  }

  return rawRgbaToPngDataUrl(rgba, width, height);
};

export const generateMaskedTryOnImage = async ({ handImageUrl, styleImageUrl, styleName, styleTags }: GenerateMaskedTryOnImageInput) => {
  const handImage = await loadRgbaImage(handImageUrl, false);
  const { components, detectionMode, mask } = createNailMask(handImage);
  const styleReference = await extractStyleReference(styleImageUrl);
  const styleLayer = synthesizeStyleLayer({
    components,
    height: handImage.height,
    mask,
    original: handImage.data,
    styleReference,
    styleName,
    styleTags,
    width: handImage.width,
  });
  const final = compositeWithOriginal({
    generatedLayer: styleLayer,
    mask,
    original: handImage.data,
  });
  const diagnostics = getImageDiagnostics({
    final,
    mask,
    original: handImage.data,
  });

  return {
    ...diagnostics,
    detectionMode,
    imageUrl: await rawRgbaToPngDataUrl(final, handImage.width, handImage.height),
    maskUrl: await maskToPngDataUrl(mask, handImage.width, handImage.height),
    nailCount: Math.min(components.length, 5),
    provider: 'local-mask-composite' as const,
    sourceDesignCount: styleReference.components.length,
  };
};
