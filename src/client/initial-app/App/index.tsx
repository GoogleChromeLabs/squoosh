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
const batchCompressPromise = import('client/lazy-app/BatchCompress');
const swBridgePromise = import('client/lazy-app/sw-bridge');

function back() {
  window.history.back();
}

interface Props {}

interface State {
  awaitingShareTarget: boolean;
  file?: File;
  files?: File[];
  isEditorOpen: Boolean;
  isBatchOpen: Boolean;
  Compress?: typeof import('client/lazy-app/Compress').default;
  BatchCompress?: typeof import('client/lazy-app/BatchCompress').default;
}

export default class App extends Component<Props, State> {
  state: State = {
    awaitingShareTarget: new URL(location.href).searchParams.has(
      'share-target',
    ),
    isEditorOpen: false,
    isBatchOpen: false,
    file: undefined,
    files: undefined,
    Compress: undefined,
    BatchCompress: undefined,
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

    batchCompressPromise
      .then((module) => {
        this.setState({ BatchCompress: module.default });
      })
      .catch(() => {
        this.showSnack('Failed to load batch mode');
      });

    swBridgePromise.then(async ({ offliner, getSharedImage }) => {
      offliner(this.showSnack);
      if (!this.state.awaitingShareTarget) return;
      const file = await getSharedImage();
      history.replaceState('', '', '/');
      this.openEditor();
      this.setState({ file, awaitingShareTarget: false });
    });

    document.body.addEventListener('gesturestart', (event: any) => {
      event.preventDefault();
    });

    window.addEventListener('popstate', this.onPopState);
  }

  private onFileDrop = ({ files }: FileDropEvent) => {
    if (!files || files.length === 0) return;
    
    if (files.length > 1) {
      this.openBatch();
      this.setState({ files: Array.from(files) });
    } else {
      this.openEditor();
      this.setState({ file: files[0] });
    }
  };

  private onIntroPickFile = (file: File) => {
    this.openEditor();
    this.setState({ file });
  };

  private onIntroPickFiles = (files: File[]) => {
    if (files.length > 1) {
      this.openBatch();
      this.setState({ files });
    } else if (files.length === 1) {
      this.openEditor();
      this.setState({ file: files[0] });
    }
  };

  private switchToSingle = (file: File) => {
    this.openEditor();
    this.setState({ file });
  };

  private switchToBatch = () => {
    this.openBatch();
    if (this.state.file) {
      this.setState({ files: [this.state.file] });
    }
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
    const editorURL = new URL(location.href);
    editorURL.pathname = ROUTE_EDITOR;
    history.pushState(null, '', editorURL.href);
    this.setState({ isEditorOpen: true, isBatchOpen: false });
  };

  private openBatch = () => {
    if (this.state.isBatchOpen) return;
    const batchURL = new URL(location.href);
    batchURL.pathname = ROUTE_BATCH;
    history.pushState(null, '', batchURL.href);
    this.setState({ isBatchOpen: true, isEditorOpen: false });
  };

  render(
    {}: Props,
    { file, files, isEditorOpen, isBatchOpen, Compress, BatchCompress, awaitingShareTarget }: State,
  ) {
    const showSpinner = awaitingShareTarget || 
      (isEditorOpen && !Compress) || 
      (isBatchOpen && !BatchCompress);

    return (
      <div class={style.app}>
        <file-drop onfiledrop={this.onFileDrop} class={style.drop}>
          {showSpinner ? (
            <loading-spinner class={style.appLoader} />
          ) : isBatchOpen ? (
            BatchCompress && (
              <BatchCompress 
                showSnack={this.showSnack} 
                onBack={back}
                onSwitchToSingle={this.switchToSingle}
                initialFiles={files}
              />
            )
          ) : isEditorOpen ? (
            Compress && (
              <Compress file={file!} showSnack={this.showSnack} onBack={back} />
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
