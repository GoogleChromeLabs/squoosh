import { h, Component, PreactHTMLAttributes } from 'preact';
import * as prettyBytes from 'pretty-bytes';
import { blobToArrayBuffer } from '../lib/util';
import GzipSizeWorker from '../lib/gzip-size.worker';

type FileContents = string | ArrayBuffer | File | Blob;

interface Props extends PreactHTMLAttributes {
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

async function compressedSize(rawData: FileContents): Promise<number | void> {
  let data = rawData;

  if (!gzipSizeWorker) {
    gzipSizeWorker = await new GzipSizeWorker();
  }

  if (typeof data === 'string') {
    data = new Blob([data]);
  }
  if (data instanceof Blob || data instanceof File) {
    data = await blobToArrayBuffer(data);
  }

  if (CACHE.has(data)) {
    return CACHE.get(data);
  }

  const size = gzipSizeWorker.gzipSize(data);
  // cache the Promise so we dedupe in-flight requests.
  CACHE.set(data, size);
  return await size;
}

export default class GzipSize extends Component<Props, State> {
  // "lock" counters for computed state properties
  counters: Partial<State> = {};

  componentDidMount() {
    const { data, compareTo } = this.props;
    if (data) {
      this.computeSize('size', data);
    }
    if (compareTo) {
      this.computeSize('compareSize', compareTo);
    }
  }

  componentWillReceiveProps({ data, compareTo }: Props) {
    if (data !== this.props.data) {
      this.computeSize('size', data);
    }
    if (compareTo !== this.props.compareTo) {
      this.computeSize('compareSize', compareTo);
    }
  }

  async computeSize(prop: keyof State, data?: FileContents) {
    const id = this.counters[prop] = (this.counters[prop] || 0) + 1;
    const size = data ? await compressedSize(data) : 0;
    if (this.counters[prop] !== id) return;
    this.setState({ [prop]: size });
  }

  render(
    { data, compareTo, increaseClass, decreaseClass, ...props }: Props,
    { size, compareSize }: State,
  ) {
    const sizeFormatted = size ? prettyBytes(size) : '';
    let delta;
    if (size && compareSize) {
      delta = (size - compareSize) / compareSize;
    }
    return (
      <span title={sizeFormatted} {...props}>
        {sizeFormatted}
        {delta && (
          <span class={delta > 0 ? increaseClass : decreaseClass}>
            {Math.round(delta * 100)}%
          </span>
        )}
      </span>
    );
  }
}
