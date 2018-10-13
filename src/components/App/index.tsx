import { h, Component } from 'preact';

import { bind, linkRef, Fileish } from '../../lib/initial-util';
import * as style from './style.scss';
import * as FileDropElement from 'file-drop-element';
import 'file-drop-element';
import SnackBarElement from '../../lib/SnackBar';
import '../../lib/SnackBar';
import Intro from '../intro';

// This is imported for TypeScript only. It isn't used.
import Compress from '../compress';

export interface SourceImage {
  file: File | Fileish;
  data: ImageData;
  vectorImage?: HTMLImageElement;
}

interface Props {}

interface State {
  file?: File | Fileish;
  Compress?: typeof Compress;
}

export default class App extends Component<Props, State> {
  state: State = {
    file: undefined,
    Compress: undefined,
  };

  snackbar?: SnackBarElement;

  constructor() {
    super();

    import('../compress').then((module) => {
      this.setState({ Compress: module.default });
    }).catch(() => {
      this.showError('Failed to load app');
    });

    // In development, persist application state across hot reloads:
    if (process.env.NODE_ENV === 'development') {
      this.setState(window.STATE);
      const oldCDU = this.componentDidUpdate;
      this.componentDidUpdate = (props, state) => {
        if (oldCDU) oldCDU.call(this, props, state);
        window.STATE = this.state;
      };
    }
  }

  @bind
  private onFileDrop(event: FileDropElement.FileDropEvent) {
    const { file } = event;
    if (!file) return;
    this.setState({ file });
  }

  @bind
  private onIntroPickFile(file: File | Fileish) {
    this.setState({ file });
  }

  @bind
  private showError(error: string) {
    if (!this.snackbar) throw Error('Snackbar missing');
    this.snackbar.showSnackbar({ message: error });
  }

  render({}: Props, { file, Compress }: State) {
    return (
      <div id="app" class={style.app}>
        <file-drop accept="image/*" onfiledrop={this.onFileDrop}>
          {(file && Compress)
            ? <Compress file={file} onError={this.showError} />
            : <Intro onFile={this.onIntroPickFile} onError={this.showError} />
          }
          <snack-bar ref={linkRef(this, 'snackbar')} />
        </file-drop>
      </div>
    );
  }
}
