import { h, Component } from 'preact';
import Toolbar from 'preact-material-components/Toolbar';
import cx from 'classnames';
import * as style from './style.scss';

type Props = {
	toggleDrawer?(),
	showHeader?(),
	showFab?(),
	loadFile?(File)
};

type State = {

};

export default class Header extends Component<Props, State> {
	input: HTMLInputElement;

	setInputRef = c => {
		this.input = c;
	};

	upload = () => {
		this.input.click();
	};

	handleFiles = () => {
		let files = this.input.files;
		if (files.length) {
			this.props.loadFile(files[0]);
		}
	};

	render({ toggleDrawer, showHeader, showFab }) {
		return (
			<Toolbar fixed class={cx(style.toolbar, 'inert', showHeader===false && style.minimal)}>
				<Toolbar.Row>
					<Toolbar.Title class={style.title}>
						<img class={style.logo} src="/assets/icon.png" />
						<Toolbar.Icon ripple onClick={this.upload}>file_upload</Toolbar.Icon>
					</Toolbar.Title>
					<Toolbar.Section align-end>
						<Toolbar.Icon ripple onClick={toggleDrawer}>menu</Toolbar.Icon>
					</Toolbar.Section>
				</Toolbar.Row>
				<input class={style.fileInput} ref={this.setInputRef} type="file" onChange={this.handleFiles} />
			</Toolbar>
		);
	}
}