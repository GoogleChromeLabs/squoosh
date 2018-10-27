import { h, Component, ComponentChildren, ComponentChild } from 'preact';

import * as style from './style.scss';
import FileSize from './FileSize';
import { DownloadIcon } from '../../lib/icons';
import '../custom-els/LoadingSpinner';
import { SourceImage } from '../compress';
import { Fileish } from '../../lib/initial-util';

interface Props {
  loading: boolean;
  source?: SourceImage;
  imageFile?: Fileish;
  downloadUrl?: string;
  children: ComponentChildren;
}

interface State {
  showLoadingState: boolean;
}

const loadingReactionDelay = 500;

export default class Results extends Component<Props, State> {
  state: State = {
    showLoadingState: false,
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

  render({ source, imageFile, downloadUrl, children }: Props, { showLoadingState }: State) {
    return (
      <div class={style.results}>
        <div class={style.resultData}>
          {(children as ComponentChild[])[0]
            ? <div class={style.resultTitle}>{children}</div>
            : null
          }
          {!imageFile || showLoadingState ? 'Working…' :
            <FileSize
              blob={imageFile}
              compareTo={(source && imageFile !== source.file) ? source.file : undefined}
            />
          }
        </div>

        <div class={style.download}>
          {(downloadUrl && imageFile) && (
            <a
              class={`${style.downloadLink} ${showLoadingState ? style.downloadLinkDisable : ''}`}
              href={downloadUrl}
              download={imageFile.name}
              title="Download"
            >
              <DownloadIcon class={style.downloadIcon} />
            </a>
          )}
          {showLoadingState && <loading-spinner class={style.spinner} />}
        </div>
      </div>
    );
  }
}
