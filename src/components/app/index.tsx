import { h, Component } from 'preact';
import { When, bind } from '../../lib/util';
import Fab from '../fab';
import Header from '../header';
// import Drawer from 'async!../drawer';
const Drawer = require('async!../drawer').default;
import Home from '../home';
import * as style from './style.scss';

type Props = {
  url?: string
};

export type FileObj = {
  id: number,
  data?: string,
  error?: Error | DOMError | String,
  file: File,
  loading: boolean
};

type State = {
  showDrawer: boolean,
  showFab: boolean,
  files: FileObj[]
};

let counter = 0;

export default class App extends Component<Props, State> {
  state: State = {
    showDrawer: false,
    showFab: true,
    files: []
  };

  enableDrawer = false;

  @bind
  openDrawer() {
    this.setState({ showDrawer: true });
  }
  @bind
  closeDrawer() {
    this.setState({ showDrawer: false });
  }
  @bind
  toggleDrawer() {
    this.setState({ showDrawer: !this.state.showDrawer });
  }

  @bind
  openFab() {
    this.setState({ showFab: true });
  }
  @bind
  closeFab() {
    this.setState({ showFab: false });
  }
  @bind
  toggleFab() {
    this.setState({ showFab: !this.state.showFab });
  }

  @bind
  loadFile(file: File) {
    let fileObj: FileObj = {
      id: ++counter,
      file,
      error: undefined,
      loading: true,
      data: undefined
    };

    this.setState({
      files: [fileObj]
    });

    let done = () => {
      let files = this.state.files.slice();
      files[files.indexOf(fileObj)] = Object.assign({}, fileObj, {
        error: fr.error,
        loading: false,
        data: fr.result
      });
      this.setState({ files });
    };

    let fr = new FileReader();
    fr.onerror = fr.onloadend = done;
    fr.readAsDataURL(file);
  }

  render({ url }: Props, { showDrawer, showFab, files }: State) {
    if (showDrawer) this.enableDrawer = true;

    if (showFab) showFab = files.length > 0;

    return (
      <div id="app" class={style.app}>
        <Fab showing={showFab} />

        <Header class={style.header} toggleDrawer={this.toggleDrawer} loadFile={this.loadFile} />

        {/* Avoid loading & rendering the drawer until the first time it is shown. */}
        <When value={showDrawer}>
          <Drawer showing={showDrawer} openDrawer={this.openDrawer} closeDrawer={this.closeDrawer} />
        </When>

        {/*
          Note: this is normally where a <Router> with auto code-splitting goes.
          Since we don't seem to need one (yet?), it's omitted.
        */}
        <div class={style.content}>
          <Home files={files} />
        </div>
      </div>
    );
  }
}
