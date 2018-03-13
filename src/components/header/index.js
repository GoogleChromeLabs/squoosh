import { h, Component } from 'preact';
import Toolbar from 'preact-material-components/Toolbar';
import cx from 'classnames';
import style from './style';

export default class Header extends Component {
	setInputRef = c => {
		this.input = c;
	};

	handleFiles = () => {
		let files = this.input.files;
		if (files.length) {
			this.props.loadFile(files[0]);
		}
	};

	upload = () => {
		// let input = document.createElement('input');
		// input.type = 'file';
		// // input.multiple = true;
		// document.body.appendChild(input);
		// input.addEventListener('change', e => {

		// });
		// input.click();
		this.input.click();
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