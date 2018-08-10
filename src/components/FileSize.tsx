import { h, Component, PreactHTMLAttributes } from 'preact';
import * as prettyBytes from 'pretty-bytes';
import { blobToArrayBuffer } from '../lib/util';
import GzipSizeWorker from '../lib/gzip-size.worker';

type FileContents = string | ArrayBuffer | File | Blob;

interface Props extends PreactHTMLAttributes {
  compress?: boolean;
  data?: FileContents;
  compareTo?: FileContents;
  increaseClass?: string;
  decreaseClass?: string;
}

interface State {
  size?: number;
  compareSize?: number;
}

let gzipSizeWorker: GzipSizeWorker;

const CACHE = new WeakMap();

async function calculateSize(rawData: FileContents, compress = false): Promise<number | void> {
  let data = rawData;

  if (typeof data === 'string') {
    data = new Blob([data]);
  }
  if (data instanceof Blob || data instanceof File) {
    data = await blobToArrayBuffer(data);
  }

  if (!compress) {
    return data.byteLength;
  }

  if (!gzipSizeWorker) {
    gzipSizeWorker = await new GzipSizeWorker();
  }

  if (CACHE.has(data)) {
    return CACHE.get(data);
  }

  const size = gzipSizeWorker.gzipSize(data);
  // cache the Promise so we dedupe in-flight requests.
  CACHE.set(data, size);
  return await size;
}

export default class FileSize extends Component<Props, State> {
  // "lock" counters for computed state properties
  counters: Partial<State> = {};

  componentDidMount() {
    const { compress, data, compareTo } = this.props;
    if (data) {
      this.computeSize('size', compress, data);
    }
    if (compareTo) {
      this.computeSize('compareSize', compress, compareTo);
    }
  }

  componentWillReceiveProps({ compress, data, compareTo }: Props) {
    if (compress !== this.props.compress || data !== this.props.data) {
      this.computeSize('size', compress, data);
    }
    if (compress !== this.props.compress || compareTo !== this.props.compareTo) {
      this.computeSize('compareSize', compress, compareTo);
    }
  }

  async computeSize(prop: keyof State, compress = false, data?: FileContents) {
    const id = this.counters[prop] = (this.counters[prop] || 0) + 1;
    const size = data ? await calculateSize(data, compress) : 0;
    if (this.counters[prop] !== id) return;
    this.setState({ [prop]: size });
  }

  render(
    { data, compareTo, increaseClass, decreaseClass, ...props }: Props,
    { size, compareSize }: State,
  ) {
    const sizeFormatted = size ? prettyBytes(size) : '';
    const delta = size && compareSize ? (size - compareSize) / compareSize : 0;
    return (
      <span title={sizeFormatted} {...props}>
        {sizeFormatted}
        {Math.abs(delta) >= 0.01 && (
          <span class={delta > 0 ? increaseClass : decreaseClass}>
            {Math.round(delta * 100)}%
          </span>
        )}
      </span>
    );
  }
}
