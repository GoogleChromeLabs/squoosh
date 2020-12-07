import { h, Component, ComponentChildren, Fragment } from 'preact';

import * as style from './style.css';
import 'add-css:./style.css';
import 'shared/custom-els/loading-spinner';
import { SourceImage } from '../';
import prettyBytes from './pretty-bytes';

interface Props {
  loading: boolean;
  source?: SourceImage;
  imageFile?: File;
  downloadUrl?: string;
  children: ComponentChildren;
  flipSide: boolean;
}

interface State {
  showLoadingState: boolean;
}

const loadingReactionDelay = 500;

export default class Results extends Component<Props, State> {
  state: State = {
    showLoadingState: this.props.loading,
  };

  /** The timeout ID between entering the loading state, and changing UI */
  private loadingTimeoutId: number = 0;

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.loading && !this.props.loading) {
      // Just stopped loading
      clearTimeout(this.loadingTimeoutId);
      this.setState({ showLoadingState: false });
    } else if (!prevProps.loading && this.props.loading) {
      // Just started loading
      this.loadingTimeoutId = self.setTimeout(
        () => this.setState({ showLoadingState: true }),
        loadingReactionDelay,
      );
    }
  }

  private onDownload = () => {
    // GA can’t do floats. So we round to ints. We're deliberately rounding to nearest kilobyte to
    // avoid cases where exact image sizes leak something interesting about the user.
    const before = Math.round(this.props.source!.file.size / 1024);
    const after = Math.round(this.props.imageFile!.size / 1024);
    const change = Math.round((after / before) * 1000);

    ga('send', 'event', 'compression', 'download', {
      metric1: before,
      metric2: after,
      metric3: change,
    });
  };

  render(
    { source, imageFile, downloadUrl, children, flipSide }: Props,
    { showLoadingState }: State,
  ) {
    const prettySize = imageFile && prettyBytes(imageFile.size);
    let diff;
    let percent;

    if (source && imageFile) {
      diff = imageFile.size / source.file.size;
      const absolutePercent = Math.round(Math.abs(diff) * 100);
      percent = diff > 1 ? absolutePercent - 100 : 100 - absolutePercent;
    }

    return (
      <div class={style.results}>
        <div class={flipSide ? style.bubbleRight : style.bubbleLeft}>
          <div class={style.bubbleInner}>
            <div class={style.sizeInfo}>
              <div class={style.downloadText}>Download</div>
              <div class={style.fileSize}>
                {prettySize && (
                  <Fragment>
                    {prettySize.value}{' '}
                    <span class={style.unit}>{prettySize.unit}</span>
                  </Fragment>
                )}
              </div>
            </div>
            <div class={style.percentInfo}>
              <svg
                viewBox="0 0 1 2"
                class={style.bigArrow}
                preserveAspectRatio="none"
              >
                <path d="M1 0v2L0 1z" />
              </svg>
              <div class={style.percentOutput}>
                {diff && diff !== 1 && (
                  <span class={style.sizeDirection}>
                    {diff < 1 ? '↓' : '↑'}
                  </span>
                )}
                <span class={style.sizeValue}>{percent || 0}</span>
                <span class={style.percentChar}>%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
