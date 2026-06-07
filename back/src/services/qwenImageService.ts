import sharp from 'sharp';
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

type CatsTaskResponse = {
  error_message?: string;
  id?: string;
  result_images?: string[];
  status?: 'completed' | 'failed' | 'pending' | 'processing' | 'queued' | string;
};

const OUTPUT_MAX_EDGE = 1024;
const OUTPUT_WEBP_QUALITY = 82;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

const getImageBytes = async (image: string): Promise<Uint8Array> => {
  const dataUrlMatch = image.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (dataUrlMatch?.[1]) {
    return new Uint8Array(Buffer.from(dataUrlMatch[1], 'base64'));
  }

  if (!/^https?:\/\//.test(image)) {
    throw createAppError('Only HTTP image URLs and data URLs are supported for Cats image generation', 400);
  }

  const response = await fetch(image);
  if (!response.ok) {
    throw createAppError(`Image fetch failed: ${response.status}`, response.status);
  }

  return new Uint8Array(await response.arrayBuffer());
};

const getImageDimensions = async (image: string): Promise<ImageDimensions | null> => {
  try {
    const bytes = await getImageBytes(image);
    return parseImageDimensions(bytes);
  } catch {
    return null;
  }
};

const getImageBase64 = async (image: string) => Buffer.from(await getImageBytes(image)).toString('base64');

const getCatsSizeFromHand = (dimensions: ImageDimensions | null) => {
  if (!dimensions?.width || !dimensions.height) {
    return '1024x1024';
  }

  const aspect = dimensions.width / dimensions.height;
  if (aspect >= 2.2) {
    return '3840x1280';
  }

  if (aspect >= 1.55) {
    return '2048x1152';
  }

  if (aspect >= 1.18) {
    return '1536x1024';
  }

  if (aspect <= 0.45) {
    return '1280x3840';
  }

  if (aspect <= 0.65) {
    return '1152x2048';
  }

  if (aspect <= 0.85) {
    return '1024x1536';
  }

  return '1024x1024';
};

const formatStyleHint = ({ styleName, styleTags = [] }: Pick<GenerateTryOnImageInput, 'styleName' | 'styleTags'>) => {
  const tags = styleTags.filter(Boolean).slice(0, 6).join('、');
  return [styleName ? `款式名称：${styleName}` : '', tags ? `款式标签：${tags}` : ''].filter(Boolean).join('\n');
};

const getCatsHeaders = () => ({
  Authorization: `Bearer ${env.CATS_API_KEY}`,
  'Content-Type': 'application/json',
});

const getFirstResultImage = (task: CatsTaskResponse) => task.result_images?.[0];

const createCatsTask = async ({
  images,
  prompt,
  size,
}: {
  images: Array<{ base64: string; name: string }>;
  prompt: string;
  size: string;
}) => {
  const response = await fetch(`${env.CATS_API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getCatsHeaders(),
    body: JSON.stringify({
      model: env.CATS_IMAGE_MODEL,
      prompt,
      task_type: 'image',
      num_images: 1,
      params: {
        quality: 'auto',
        rewritePrompt: false,
        size,
      },
      images,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as CatsTaskResponse;

  if (!response.ok || !payload.id) {
    throw createAppError(`Cats image task create failed: ${response.status}`, response.status, {
      detail: JSON.stringify(payload).slice(0, 1000),
    });
  }

  return payload.id;
};

const pollCatsTask = async (taskId: string, label: string) => {
  const maxAttempts = 60;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(`${env.CATS_API_BASE_URL}/tasks/${taskId}`, {
      headers: getCatsHeaders(),
    });
    const payload = (await response.json().catch(() => ({}))) as CatsTaskResponse;

    if (!response.ok) {
      throw createAppError(`${label} query failed: ${response.status}`, response.status, {
        detail: JSON.stringify(payload).slice(0, 1000),
      });
    }

    if (payload.status === 'completed') {
      const imageUrl = getFirstResultImage(payload);
      if (!imageUrl) {
        throw createAppError(`${label} completed without result image`, 502, {
          detail: JSON.stringify(payload).slice(0, 1000),
        });
      }

      return {
        imageUrl,
        raw: payload,
      };
    }

    if (payload.status === 'failed') {
      throw createAppError(`${label} failed: ${payload.error_message ?? 'unknown error'}`, 502, {
        detail: JSON.stringify(payload).slice(0, 1000),
      });
    }

    await sleep(2500);
  }

  throw createAppError(`${label} timed out`, 504, { detail: JSON.stringify({ taskId }) });
};

const runCatsImageTask = async ({
  images,
  label,
  prompt,
  size,
}: {
  images: Array<{ base64: string; name: string }>;
  label: string;
  prompt: string;
  size: string;
}) => {
  const taskId = await createCatsTask({ images, prompt, size });
  console.log(`[AI 试戴] ${label}任务已创建`, {
    taskId,
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
  });
  return pollCatsTask(taskId, label);
};

export const compressImageToWebpDataUrl = async (image: string) => {
  const bytes = Buffer.from(await getImageBytes(image));
  const webp = await sharp(bytes)
    .rotate()
    .resize({
      fit: 'inside',
      height: OUTPUT_MAX_EDGE,
      width: OUTPUT_MAX_EDGE,
      withoutEnlargement: true,
    })
    .webp({
      effort: 5,
      quality: OUTPUT_WEBP_QUALITY,
    })
    .toBuffer();

  return `data:image/webp;base64,${webp.toString('base64')}`;
};

const buildTryOnComposePrompt = (styleHint: string) =>
  [
    '把图1中的美甲款式自然合成到图2用户原手图的真实指甲上，生成真实摄影风格的美甲试戴结果。',
    '',
    '输入说明：',
    '图1：完整美甲款式参考图，只提供甲片设计信息。',
    '图2：用户上传的原始手图，是最终画面的主体。',
    styleHint ? `款式语义参考：\n${styleHint}` : '',
    '',
    '强制要求：',
    '1. 保持图2的同一只手、同一手势、同一肤色、同一背景、同一光影、同一镜头角度、同一裁切范围。',
    '2. 只提取图1中的甲片设计，不要复制图1里的手、皮肤、戒指、袖口、背景、花朵、道具、文字或构图。',
    '3. 如果图1每个手指款式不同，请把这种“每指不同”的节奏迁移到图2对应真实指甲上，按目标指甲的透视、弧度、宽度、长度自然变形。',
    '4. 图2原本的旧美甲颜色和旧图案必须被新甲片覆盖。',
    '5. 图1甲片上的花纹、棋盘格、钻饰、亮片、渐变、法式边、高光和透明质感必须尽量保留，不要简化成纯色。',
    '6. 甲片必须严格停留在真实甲床边界内：要清楚保留后缘指皮、近甲皱襞、两侧甲沟和手指皮肤的分界线，不要把颜色或材质长进手指肉里。',
    '7. 指甲根部需要有明确的 cuticle 边界感，甲片不要覆盖到指缘皮肤；甲片两侧也不要溢出到侧边皮肤，保留真实的侧缘阴影与缝隙。',
    '8. 甲片前端可以延伸到真实自由缘，但不能从指甲内部向手指根部倒灌，也不能让甲片看起来埋进手指里面。',
    '9. 甲片只能出现在真实指甲区域内，不要画到手指、手背、关节、背景或画面其他位置。',
    '10. 不要移动、旋转、重绘、弯曲、拉长、缩短或遮挡任何手指；不要改变手势，不要裁掉指尖。',
    '11. 不要新增鸟、蝴蝶、彩纸、贴纸、漂浮方块、额外花朵、文字、Logo、水印或任何无关装饰。',
    '',
    '输出必须像图2原照片的自然延续，只是用户真实指甲佩戴了图1款式。',
    '尤其要保证能看出真实指甲与手指皮肤之间的边界感，不要出现“美甲长进手指里面”的效果。',
  ].join('\n');

export const generateTryOnImage = async ({ handImageUrl, styleImageUrl, styleName, styleTags }: GenerateTryOnImageInput) => {
  if (!env.CATS_API_KEY) {
    throw createAppError('CATS_API_KEY is not configured', undefined, { code: 'MISSING_CATS_API_KEY' });
  }

  const [handDimensions, handBase64, styleBase64] = await Promise.all([
    getImageDimensions(handImageUrl),
    getImageBase64(handImageUrl),
    getImageBase64(styleImageUrl),
  ]);
  const styleHint = formatStyleHint({ styleName, styleTags });
  const finalResult = await runCatsImageTask({
    images: [
      { base64: styleBase64, name: 'style-reference.png' },
      { base64: handBase64, name: 'original-hand.png' },
    ],
    label: '试戴合成',
    prompt: buildTryOnComposePrompt(styleHint),
    size: getCatsSizeFromHand(handDimensions),
  });

  return {
    imageUrl: finalResult.imageUrl,
    provider: env.CATS_IMAGE_MODEL,
    raw: finalResult.raw,
  };
};
