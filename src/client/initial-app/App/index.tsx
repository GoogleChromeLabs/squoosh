import type { FileDropEvent } from 'file-drop-element';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import type { SnackOptions } from 'shared/custom-els/snack-bar';

import { h, Component } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import * as style from './style.css';
import 'add-css:./style.css';
import 'file-drop-element';
import 'shared/custom-els/snack-bar';
import Intro from 'shared/prerendered-app/Intro';
import 'shared/custom-els/loading-spinner';

const ROUTE_EDITOR = '/editor';
const ROUTE_BATCH = '/batch';

const compressPromise = import('client/lazy-app/Compress');
const batchPromise = import('client/lazy-app/Batch');
const swBridgePromise = import('client/lazy-app/sw-bridge');

function back() {
  window.history.back();
}

interface Props {}

interface State {
  awaitingShareTarget: boolean;
  file?: File;
  files?: File[];
  isEditorOpen: boolean;
  isBatchOpen: boolean;
  Compress?: typeof import('client/lazy-app/Compress').default;
  Batch?: typeof import('client/lazy-app/Batch').default;
}

export default class App extends Component<Props, State> {
  state: State = {
    awaitingShareTarget: new URL(location.href).searchParams.has(
      'share-target',
    ),
    isEditorOpen: location.pathname === ROUTE_EDITOR,
    isBatchOpen: location.pathname === ROUTE_BATCH,
    file: undefined,
    files: undefined,
    Compress: undefined,
    Batch: undefined,
  };

  snackbar?: SnackBarElement;

  constructor() {
    super();

    compressPromise
      .then((module) => {
        this.setState({ Compress: module.default });
      })
      .catch(() => {
        this.showSnack('Failed to load app');
      });

    batchPromise
      .then((module) => {
        this.setState({ Batch: module.default });
      })
      .catch(() => {
        this.showSnack('Failed to load batch compressor');
      });

    swBridgePromise.then(async ({ offliner, getSharedImage }) => {
      offliner(this.showSnack);
      if (!this.state.awaitingShareTarget) return;
      const file = await getSharedImage();
      // Remove the ?share-target from the URL
      history.replaceState('', '', '/');
      this.openEditor();
      this.setState({ file, awaitingShareTarget: false });
    });

    // Since iOS 10, Apple tries to prevent disabling pinch-zoom. This is great in theory, but
    // really breaks things on Squoosh, as you can easily end up zooming the UI when you mean to
    // zoom the image. Once you've done this, it's really difficult to undo. Anyway, this seems to
    // prevent it.
    document.body.addEventListener('gesturestart', (event: any) => {
      event.preventDefault();
    });

    window.addEventListener('popstate', this.onPopState);
  }

  private onFileDrop = ({ files }: FileDropEvent) => {
    if (!files || files.length === 0) return;
    if (this.state.isBatchOpen) {
      this.setState({ files });
    } else if (files.length > 1) {
      this.openBatch();
      this.setState({ files });
    } else {
      const file = files[0];
      this.openEditor();
      this.setState({ file });
    }
  };

  private onIntroPickFile = (file: File) => {
    this.openEditor();
    this.setState({ file });
  };

  private onIntroPickFiles = (files: File[]) => {
    this.openBatch();
    this.setState({ files });
  };

  private showSnack = (
    message: string,
    options: SnackOptions = {},
  ): Promise<string> => {
    if (!this.snackbar) throw Error('Snackbar missing');
    return this.snackbar.showSnackbar(message, options);
  };

  private onPopState = () => {
    this.setState({
      isEditorOpen: location.pathname === ROUTE_EDITOR,
      isBatchOpen: location.pathname === ROUTE_BATCH,
    });
  };

  private openEditor = () => {
    if (this.state.isEditorOpen) return;
    // Change path, but preserve query string.
    const editorURL = new URL(location.href);
    editorURL.pathname = ROUTE_EDITOR;
    history.pushState(null, '', editorURL.href);
    this.setState({ isEditorOpen: true });
  };

  private openBatch = () => {
    if (this.state.isBatchOpen) return;
    const batchURL = new URL(location.href);
    batchURL.pathname = ROUTE_BATCH;
    history.pushState(null, '', batchURL.href);
    this.setState({ isBatchOpen: true });
  };

  render(
    {}: Props,
    { file, files, isEditorOpen, isBatchOpen, Compress, Batch, awaitingShareTarget }: State,
  ) {
    const showSpinner = awaitingShareTarget || (isEditorOpen && !Compress) || (isBatchOpen && !Batch);

    return (
      <div class={style.app}>
        <file-drop multiple onfiledrop={this.onFileDrop} class={style.drop}>
          {showSpinner ? (
            <loading-spinner class={style.appLoader} />
          ) : isEditorOpen ? (
            Compress && (
              <Compress file={file!} showSnack={this.showSnack} onBack={back} />
            )
          ) : isBatchOpen ? (
            Batch && (
              <Batch initialFiles={files || []} showSnack={this.showSnack} onBack={back} />
            )
          ) : (
            <Intro
              onFile={this.onIntroPickFile}
              onFiles={this.onIntroPickFiles}
              showSnack={this.showSnack}
            />
          )}
          <snack-bar ref={linkRef(this, 'snackbar')} />
        </file-drop>
      </div>
    );
  }
}
