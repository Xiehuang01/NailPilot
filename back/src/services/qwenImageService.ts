import { env } from '../config/env.js';
import { createAppError } from '../types/http.js';

type JsonRecord = Record<string, any>;

type GenerateTryOnImageInput = {
  handImageUrl: string;
  styleImageUrl: string;
  styleName?: string;
  styleTags?: string[];
};

type ImageDimensions = {
  height: number;
  width: number;
};

const extractImageUrl = (payload: JsonRecord) => {
  const content = payload.output?.choices?.[0]?.message?.content ?? payload.output?.choices?.[0]?.message?.contents;
  const items = Array.isArray(content) ? content : [];
  const imageItem = items.find((item: JsonRecord) => item.image || item.image_url || item.url);

  return imageItem?.image ?? imageItem?.image_url ?? imageItem?.url ?? payload.output?.url ?? payload.output?.image_url;
};

const parsePngDimensions = (bytes: Uint8Array): ImageDimensions | null => {
  if (bytes.length < 24 || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  };
};

const parseJpegDimensions = (bytes: Uint8Array): ImageDimensions | null => {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if (length < 2) {
      return null;
    }

    if (marker >= 0xc0 && marker <= 0xc3 && offset + 8 < bytes.length) {
      return {
        height: (bytes[offset + 5] << 8) + bytes[offset + 6],
        width: (bytes[offset + 7] << 8) + bytes[offset + 8],
      };
    }

    offset += 2 + length;
  }

  return null;
};

const parseWebpDimensions = (bytes: Uint8Array): ImageDimensions | null => {
  const header = String.fromCharCode(...bytes.slice(0, 12));
  if (bytes.length < 30 || !header.startsWith('RIFF') || !header.endsWith('WEBP')) {
    return null;
  }

  const chunk = String.fromCharCode(...bytes.slice(12, 16));
  if (chunk === 'VP8X' && bytes.length >= 30) {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    };
  }

  if (chunk === 'VP8 ' && bytes.length >= 30) {
    return {
      width: bytes[26] + ((bytes[27] & 0x3f) << 8),
      height: bytes[28] + ((bytes[29] & 0x3f) << 8),
    };
  }

  if (chunk === 'VP8L' && bytes.length >= 25) {
    const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
};

const parseImageDimensions = (bytes: Uint8Array): ImageDimensions | null =>
  parsePngDimensions(bytes) ?? parseJpegDimensions(bytes) ?? parseWebpDimensions(bytes);

const getImageBytes = async (image: string): Promise<Uint8Array | null> => {
  const dataUrlMatch = image.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (dataUrlMatch?.[1]) {
    return new Uint8Array(Buffer.from(dataUrlMatch[1], 'base64'));
  }

  if (!/^https?:\/\//.test(image)) {
    return null;
  }

  const response = await fetch(image);
  if (!response.ok) {
    return null;
  }

  return new Uint8Array(await response.arrayBuffer());
};

const getImageDimensions = async (image: string): Promise<ImageDimensions | null> => {
  try {
    const bytes = await getImageBytes(image);
    return bytes ? parseImageDimensions(bytes) : null;
  } catch {
    return null;
  }
};

const roundToMultipleOf16 = (value: number) => Math.max(512, Math.min(2048, Math.round(value / 16) * 16));

const getQwenSizeFromHand = (dimensions: ImageDimensions | null) => {
  if (!dimensions?.width || !dimensions.height) {
    return undefined;
  }

  const aspect = dimensions.width / dimensions.height;
  const targetPixels = 1024 * 1024;
  const width = roundToMultipleOf16(Math.sqrt(targetPixels * aspect));
  const height = roundToMultipleOf16(width / aspect);
  return `${width}*${height}`;
};

const getPayloadDimensions = (payload: JsonRecord): ImageDimensions | null => {
  const width = Number(payload.usage?.width);
  const height = Number(payload.usage?.height);
  return Number.isFinite(width) && Number.isFinite(height) ? { width, height } : null;
};

const formatStyleHint = ({ styleName, styleTags = [] }: Pick<GenerateTryOnImageInput, 'styleName' | 'styleTags'>) => {
  const tags = styleTags.filter(Boolean).slice(0, 6).join('、');
  return [styleName ? `款式名称：${styleName}` : '', tags ? `款式标签：${tags}` : ''].filter(Boolean).join('\n');
};

const assertOutputUsesHandCanvas = async ({
  handDimensions,
  outputImageUrl,
  payload,
  styleDimensions,
}: {
  handDimensions: ImageDimensions | null;
  outputImageUrl: string;
  payload: JsonRecord;
  styleDimensions: ImageDimensions | null;
}) => {
  const outputDimensions = getPayloadDimensions(payload) ?? (await getImageDimensions(outputImageUrl));
  if (!handDimensions || !outputDimensions) {
    return;
  }

  const outputAspect = outputDimensions.width / outputDimensions.height;
  const handAspect = handDimensions.width / handDimensions.height;
  const styleAspect = styleDimensions ? styleDimensions.width / styleDimensions.height : null;
  const handDelta = Math.abs(outputAspect - handAspect);
  const styleDelta = styleAspect === null ? Number.POSITIVE_INFINITY : Math.abs(outputAspect - styleAspect);

  if (handDelta > 0.12 && styleDelta + 0.04 < handDelta) {
    throw createAppError('Qwen image output used the style reference canvas instead of the uploaded hand canvas', 502, {
      detail: JSON.stringify({ handDimensions, outputDimensions, styleDimensions }),
    });
  }
};

export const generateTryOnImage = async ({ handImageUrl, styleImageUrl, styleName, styleTags }: GenerateTryOnImageInput) => {
  if (!env.DASHSCOPE_API_KEY) {
    throw createAppError('DASHSCOPE_API_KEY is not configured', undefined, { code: 'MISSING_DASHSCOPE_API_KEY' });
  }

  const [handDimensions, styleDimensions] = await Promise.all([getImageDimensions(handImageUrl), getImageDimensions(styleImageUrl)]);
  const styleHint = formatStyleHint({ styleName, styleTags });
  const prompt = [
    '你是专业美甲局部重绘模型。请执行“只重绘指甲甲面”的图片编辑任务，不要生成全新场景。',
    '',
    '输入说明：',
    '图1是用户上传的原始手图，也是最终输出必须使用的唯一画布。',
    '图2是美甲款式参考图，但图2中的手、皮肤、戒指、袖口、花、背景、道具都不是目标内容。',
    '图3与图1相同，用于再次锁定最终画布、手势、背景、镜头角度、裁切和可见手指数。',
    styleHint ? `款式语义参考：\n${styleHint}` : '',
    '',
    '最高优先级硬规则：',
    '1. 最终图必须保持图1/图3的同一只手、同一手势、同一背景、同一光影、同一镜头角度、同一裁切范围。',
    '2. 只能编辑图1/图3中真实存在的指甲甲面区域；手指、手背、皮肤纹理、关节、戒指、背景和画面外区域都不能被重绘。',
    '3. 图1/图3中原本已有的美甲颜色和图案只是旧甲面，必须完全擦除并替换为图2款式；不要保留蓝色、花朵或任何原图旧甲片设计。',
    '4. 图2只用于提取甲片设计：主色、跳色顺序、棋盘格/线条/花纹形状、渐变方向、亮片密度、钻饰位置、金属/珠光/猫眼高光、透明度和法式边。',
    '5. 如果图2每个手指有不同设计，请按从拇指到小指的视觉节奏迁移到图1/图3对应可见指甲；不要把复杂款式简化成纯色。',
    '6. 图2里的装饰只能出现在甲面内部，并且必须被甲面边界裁切；绝对不要把亮片、棋盘格、花、贴纸或任何装饰散落到手背、背景或画面其他位置。',
    '7. 禁止复制图2的手势、皮肤、戒指、袖口、背景、花朵、道具或人物结构；禁止把图2画布当成输出画布。',
    '8. 禁止新增图1/图3不存在的物体，包括鸟、蝴蝶、彩纸、贴纸、漂浮方块、额外花朵、文字、Logo、水印。',
    '9. 不能移动、旋转、拉长、缩短、重绘或遮挡任何手指；不能裁掉拇指、小指、指尖或画面边缘已有的手指。',
    '10. 如果无法完全识别某个指甲的图案，也要保持图1/图3手势和背景优先，只在甲面内做最接近图2的款式复刻。',
    '',
    '输出要求：',
    '最终图看起来必须仍然是图1/图3这张照片，只是每个真实指甲准确佩戴图2款式。',
    '不要生成插画感、拼贴感、海报感、贴纸感或奇幻装饰效果。',
  ].join('\n');

  const response = await fetch(env.DASHSCOPE_IMAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.QWEN_IMAGE_MODEL,
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { image: handImageUrl },
              { image: styleImageUrl },
              { image: handImageUrl },
              { text: prompt },
            ],
          },
        ],
      },
      parameters: {
        n: 1,
        prompt_extend: false,
        size: getQwenSizeFromHand(handDimensions),
        watermark: false,
        negative_prompt:
          'use image 2 as canvas, copy image 2 hand, copy image 2 ring, copy image 2 sleeve, copy image 2 background, changed hand pose, curled fist, clenched hand, palm side, moved fingers, different gesture, changed camera angle, changed crop, cropped fingers, missing thumb, missing pinky, missing fingers, hidden fingers, extra fingers, deformed fingers, fused fingers, elongated fingers, shortened fingers, changed background, changed skin tone, keep old nail polish, keep original blue nails, old manicure remains, simplified nail design, plain nails, wrong nail pattern, wrong nail color, random decoration outside nails, invented decoration, floating confetti, colored squares, birds, butterflies, stickers, flowers outside nails, glitter outside nails, rhinestones outside nails, missing checkerboard, missing stripe, missing glitter, missing rhinestones, missing french tip, missing cat eye highlight, text, logo, watermark',
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw createAppError(`Qwen image request failed: ${response.status}`, response.status, { detail });
  }

  const payload = (await response.json()) as JsonRecord;
  const imageUrl = extractImageUrl(payload);

  if (!imageUrl) {
    throw createAppError('Qwen image response did not include an image URL', 502, {
      detail: JSON.stringify(payload).slice(0, 1000),
    });
  }

  await assertOutputUsesHandCanvas({
    handDimensions,
    outputImageUrl: imageUrl,
    payload,
    styleDimensions,
  });

  return {
    imageUrl,
    raw: payload,
  };
};
