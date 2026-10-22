import type {
  Arbiter,
  CodingTransform,
  EncodeOptions,
  GroupOrder,
  LossyModular,
} from '../shared/meta';
import { withEncoder } from '../shared/encoderModule';

const lossyModularModes: Record<LossyModular, number> = {
  off: 0,
  auto: 1,
  force: 2,
};

const codingTransforms: Record<CodingTransform, number> = {
  xyb: 0,
  ycbcr: 1,
  rgb: 2,
};

const groupOrders: Record<GroupOrder, number> = {
  scanline: 0,
  center: 1,
  diagonals: 2,
};

const arbiters: Record<Arbiter, number> = {
  ssimulacra2: 0,
  cvvdp: 1,
};

export default function encode(
  data: ImageData,
  options: EncodeOptions,
): Promise<ArrayBuffer> {
  const lossless = options.mode === 'lossless';

  return withEncoder((module) =>
    module.encode(data.data, data.width, data.height, {
      lossless,
      quality: options.quality,
      speed: options.effort - 1,
      // A single pass is what non-progressive means for lossy.
      progressivePasses:
        !lossless && options.progressive ? options.progressivePasses : 1,
      progressive: lossless && options.progressive,
      patches: options.patches,
      splines: options.splines,
      dots: options.dots,
      lossyModular: lossyModularModes[options.lossyModular],
      codingTransform: codingTransforms[options.codingTransform],
      learnedRate: options.learnedRate,
      fillInvisible: !options.preserveTransparentData,
      decodingSpeed: options.decodingSpeed,
      progressiveDC: options.progressiveDC,
      groupOrder: groupOrders[options.groupOrder],
      arbiter: arbiters[options.arbiter],
    }),
  );
}
