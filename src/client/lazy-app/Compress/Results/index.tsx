import { h, Component, ComponentChildren, ComponentChild } from 'preact';

import * as style from './style.css';
import 'add-css:./style.css';
import FileSize from './FileSize';
import {
  DownloadIcon,
  CopyAcrossIcon,
  CopyAcrossIconProps,
} from 'client/lazy-app/icons';
import 'shared/custom-els/loading-spinner';
import { SourceImage } from '../';

interface Props {
  loading: boolean;
  source?: SourceImage;
  imageFile?: File;
  downloadUrl?: string;
  children: ComponentChildren;
  copyDirection: CopyAcrossIconProps['copyDirection'];
  buttonPosition: keyof typeof buttonPositionClass;
  onCopyToOtherClick(): void;
}

interface State {
  showLoadingState: boolean;
}

const buttonPositionClass = {
  'stack-right': style.stackRight,
  'download-right': style.downloadRight,
  'download-left': style.downloadLeft,
};

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

  private onCopyToOtherClick = (event: Event) => {
    event.preventDefault();
    this.props.onCopyToOtherClick();
  };

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
    {
      source,
      imageFile,
      downloadUrl,
      children,
      copyDirection,
      buttonPosition,
    }: Props,
    { showLoadingState }: State,
  ) {
    return (
      <div class={`${style.results} ${buttonPositionClass[buttonPosition]}`}>
        <div class={style.resultData}>
          {children ? <div class={style.resultTitle}>{children}</div> : null}
          {!imageFile || showLoadingState ? (
            'Working…'
          ) : (
            <FileSize
              blob={imageFile}
              compareTo={
                source && imageFile !== source.file ? source.file : undefined
              }
            />
          )}
        </div>

        <button
          class={style.copyToOther}
          title="Copy settings to other side"
          onClick={this.onCopyToOtherClick}
        >
          <CopyAcrossIcon
            class={style.copyIcon}
            copyDirection={copyDirection}
          />
        </button>

        <div class={style.download}>
          {downloadUrl && imageFile && (
            <a
              class={`${style.downloadLink} ${
                showLoadingState ? style.downloadLinkDisable : ''
              }`}
              href={downloadUrl}
              download={imageFile.name}
              title="Download"
              onClick={this.onDownload}
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
