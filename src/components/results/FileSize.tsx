import { h, Component } from 'preact';
import * as prettyBytes from 'pretty-bytes';
import * as style from './style.scss';

interface Props {
  blob: Blob;
  compareTo?: Blob;
}

interface State {}

export default class FileSize extends Component<Props, State> {
  render({ blob, compareTo }: Props) {
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

    return <span>{prettyBytes(blob.size)} {comparison}</span>;
  }
}
