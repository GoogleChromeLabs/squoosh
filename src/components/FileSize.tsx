import { h, Component, ClassAttributes } from 'preact';
import * as prettyBytes from 'pretty-bytes';

type FileContents = string | ArrayBuffer | File | Blob;

interface Props extends ClassAttributes<HTMLSpanElement> {
  compress?: boolean;
  data?: FileContents;
  compareTo?: FileContents;
  class?: string;
  increaseClass?: string;
  decreaseClass?: string;
}

interface State {
  size?: number;
  sizeFormatted?: string;
  compareSize?: number;
  compareSizeFormatted?: string;
}

function calculateSize(data: FileContents, compress = false): number | void {
  if (typeof data === 'string') {
    return data.length;
  }

  if (data instanceof ArrayBuffer) {
    return data.byteLength;
  }

  if (data instanceof Blob) {
    return data.size;
  }
}

export default class FileSize extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    if (props.data) {
      this.computeSize('size', props.data);
    }
    if (props.compareTo) {
      this.computeSize('compareSize', props.compareTo);
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

  componentDidMount() {
    this.applyStyles();
  }

  componentDidUpdate() {
    this.applyStyles();
  }

  applyStyles() {
    const { size, compareSize= 0 } = this.state;
    if (size != null && this.base) {
      const delta = Math.round(size && compareSize ? (size - compareSize) / compareSize * 100 : 0);
      this.base.style.setProperty('--size', '' + size);
      this.base.style.setProperty('--size-delta', '' + Math.abs(delta));
    }
  }

  computeSize(prop: keyof State, data?: FileContents) {
    const size = data && calculateSize(data) || 0;
    const pretty = prettyBytes(size);
    this.setState({
      [prop]: size,
      [prop + 'Formatted']: pretty,
    });
  }

  render(
    { data, compareTo, increaseClass, decreaseClass, ...props }: Props,
    { size, sizeFormatted = '', compareSize }: State,
  ) {
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
