import { h, Component } from 'preact';
import Toolbar from 'preact-material-components/Toolbar';
import cx from 'classnames';
import * as style from './style.scss';
import { bind } from '../../lib/util';

type Props = {
  'class'?: string,
  showHeader?: boolean,
  onToggleDrawer?(): void,
  showFab?(): void,
  loadFile(f: File): void
};

type State = {};

export default class Header extends Component<Props, State> {
  input?: HTMLInputElement;

  @bind
  setInputRef(c?: Element) {
    this.input = c as HTMLInputElement;
  }

  @bind
  upload() {
    this.input!.click();
  }

  @bind
  handleFiles() {
    let files = this.input!.files;
    if (files && files.length) {
      this.props.loadFile(files[0]);
    }
  }

  render({ class: c, onToggleDrawer, showHeader = false, showFab }: Props) {
    return (
      <Toolbar fixed class={cx(c, style.toolbar, 'inert', !showHeader && style.minimal)}>
        <Toolbar.Row>
          <Toolbar.Title class={style.title}>
            <Toolbar.Icon title="Upload" ripple onClick={this.upload}>file_upload</Toolbar.Icon>
          </Toolbar.Title>
          <Toolbar.Section align-end>
            <Toolbar.Icon ripple onClick={onToggleDrawer}>menu</Toolbar.Icon>
          </Toolbar.Section>
        </Toolbar.Row>
        <input class={style.fileInput} ref={this.setInputRef} type="file" onChange={this.handleFiles} />
      </Toolbar>
    );
  }
}
