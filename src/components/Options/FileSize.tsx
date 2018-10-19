import { h, Component } from 'preact';
import * as prettyBytes from 'pretty-bytes';
import * as style from './style.scss';

interface Props {
  blob: Blob;
  compareTo?: Blob;
}

interface State {
  sizeFormatted?: string;
}

export default class FileSize extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    if (props.blob) {
      this.setState({
        sizeFormatted: prettyBytes(props.blob.size),
      });
    }
  }

  componentWillReceiveProps({ blob }: Props) {
    if (blob) {
      this.setState({
        sizeFormatted: prettyBytes(blob.size),
      });
    }
  }

  render(
    { blob, compareTo }: Props,
    { sizeFormatted }: State,
  ) {
    let comparison: JSX.Element | undefined;

    if (compareTo) {
      const delta = blob.size / compareTo.size;
      if (delta > 1) {
        const percent = Math.round((delta - 1) * 100) + '%';
        comparison = (
          <span class={`${style.sizeDelta} ${style.sizeIncrease}`}>
            {percent === '0%' ? 'slightly' : percent} bigger
          </span>
        );
      } else if (delta < 1) {
        const percent = Math.round((1 - delta) * 100) + '%';
        comparison = (
          <span class={`${style.sizeDelta} ${style.sizeDecrease}`}>
            {percent === '0%' ? 'slightly' : percent} smaller
          </span>
        );
      } else {
        comparison = (
          <span class={style.sizeDelta}>no change</span>
        );
      }
    }

    return <span>{sizeFormatted} {comparison}</span>;
  }
}
