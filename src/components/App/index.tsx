import { h, Component } from 'preact';

import { bind, linkRef, Fileish } from '../../lib/initial-util';
import * as style from './style.scss';
import { FileDropEvent } from 'file-drop-element';
import 'file-drop-element';
import SnackBarElement, { SnackOptions } from '../../lib/SnackBar';
import '../../lib/SnackBar';
import Intro from '../intro';
import '../custom-els/LoadingSpinner';

const compressPromise = import(
  /* webpackChunkName: "main-app" */
  '../compress',
);
const offlinerPromise = import(
  /* webpackChunkName: "offliner" */
  '../../lib/offliner',
);

export interface SourceImage {
  file: File | Fileish;
  data: ImageData;
  vectorImage?: HTMLImageElement;
}

interface Props {}

interface State {
  file?: File | Fileish;
  Compress?: typeof import('../compress').default;
}

export default class App extends Component<Props, State> {
  state: State = {
    file: undefined,
    Compress: undefined,
  };

  snackbar?: SnackBarElement;

  constructor() {
    super();

    compressPromise.then((module) => {
      this.setState({ Compress: module.default });
    }).catch(() => {
      this.showSnack('Failed to load app');
    });

    offlinerPromise.then(({ offliner }) => offliner(this.showSnack));

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
  private onFileDrop(event: FileDropEvent) {
    const { file } = event;
    if (!file) return;
    this.setState({ file });
  }

  @bind
  private onIntroPickFile(file: File | Fileish) {
    this.setState({ file });
  }

  @bind
  private showSnack(message: string, options: SnackOptions = {}): Promise<string> {
    if (!this.snackbar) throw Error('Snackbar missing');
    return this.snackbar.showSnackbar(message, options);
  }

  @bind
  private onBack() {
    this.setState({ file: undefined });
  }

  render({}: Props, { file, Compress }: State) {
    return (
      <div id="app" class={style.app}>
        <file-drop accept="image/*" onfiledrop={this.onFileDrop} class={style.drop}>
          {(!file)
            ? <Intro onFile={this.onIntroPickFile} showSnack={this.showSnack} />
            : (Compress)
              ? <Compress file={file} showSnack={this.showSnack} onBack={this.onBack} />
              : <loading-spinner class={style.appLoader}/>
          }
          <snack-bar ref={linkRef(this, 'snackbar')} />
        </file-drop>
      </div>
    );
  }
}
