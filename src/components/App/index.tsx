import { h, Component } from 'preact';

import { bind, linkRef, Fileish } from '../../lib/initial-util';
import * as style from './style.scss';
import { FileDropEvent } from 'file-drop-element';
import 'file-drop-element';
import SnackBarElement, { SnackOptions } from '../../lib/SnackBar';
import '../../lib/SnackBar';
import Intro from '../intro';
import '../custom-els/LoadingSpinner';
import history from '../../lib/history';

const ROUTE_EDITOR = '/editor';

// This is imported for TypeScript only. It isn't used.
import Compress from '../compress';

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
  isEditorOpen: Boolean;
  Compress?: typeof Compress;
}

export default class App extends Component<Props, State> {
  state: State = {
    isEditorOpen: false,
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
  private onFileDrop({ file }: FileDropEvent) {
    if (!file) return;
    this.setState({ file }, this.openEditor);
  }

  @bind
  private onIntroPickFile(file: File | Fileish) {
    this.setState({ file }, this.openEditor);
  }

  @bind
  private showSnack(message: string, options: SnackOptions = {}): Promise<string> {
    if (!this.snackbar) throw Error('Snackbar missing');
    return this.snackbar.showSnackbar(message, options);
  }

  @bind
  private onPopState() {
    history.pathname === ROUTE_EDITOR ?
      this.setState({ isEditorOpen: true }) :
      this.setState({ isEditorOpen: false });
  }

  @bind
  private openEditor() {
    history.push(ROUTE_EDITOR);
    this.setState({ isEditorOpen: true });
  }

  componentDidMount() {
    history.addPopStateListener(this.onPopState);
  }

  componentWillUnmount() {
    history.removePopStateListener(this.onPopState);
  }

  render({}: Props, { file, isEditorOpen, Compress }: State) {
    return (
      <div id="app" class={style.app}>
        <file-drop accept="image/*" onfiledrop={this.onFileDrop} class={style.drop}>
          {(!file || !isEditorOpen)
            ? <Intro onFile={this.onIntroPickFile} showSnack={this.showSnack} />
            : (Compress)
              ? <Compress file={file} showSnack={this.showSnack} onBack={history.back} />
              : <loading-spinner class={style.appLoader}/>
          }
          <snack-bar ref={linkRef(this, 'snackbar')} />
        </file-drop>
      </div>
    );
  }
}
