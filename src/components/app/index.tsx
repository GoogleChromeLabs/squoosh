import { h, Component } from 'preact';
import { updater, toggle, When } from '../../lib/util';
import Fab from '../fab';
import Header from '../header';
// import Drawer from 'async!../drawer';
import Home from '../home';
import * as style from './style.scss';

type Props = {
	url?: String
}

type FileObj = {
	id: any,
	data: any,
	error: Error | DOMError | String,
	file: File,
	loading: Boolean
};

type State = {
	showDrawer: Boolean,
	showFab: Boolean,
	files: FileObj[]
};

let counter = 0;

export default class App extends Component<Props, State> {
	state: State = {
		showDrawer: false,
		showFab: true,
		files: []
	};

	loadFile = (file: File) => {
		let fileObj = {
			id: ++counter,
			file,
			error: null,
			loading: true,
			data: null
		};

		this.setState({
			files: [fileObj]
		});

		let fr = new FileReader();
		// fr.readAsArrayBuffer();
		fr.onerror = () => {
			let files = this.state.files.slice();
			files.splice(0, files.indexOf(fileObj), {
				...fileObj,
				error: fr.error,
				loading: false
			});
			this.setState({ files });
		};
		fr.onloadend = () => {
			let files = this.state.files.slice();
			files.splice(0, files.indexOf(fileObj), {
				...fileObj,
				data: fr.result,
				loading: false
			});
			this.setState({ files });
		};
		fr.readAsDataURL(file);
	};

	enableDrawer = false;

	openDrawer = updater(this, 'showDrawer', true);
	closeDrawer = updater(this, 'showDrawer', false);
	toggleDrawer = updater(this, 'showDrawer', toggle);

	openFab = updater(this, 'showFab', true);
	closeFab = updater(this, 'showFab', false);
	toggleFab = updater(this, 'showFab', toggle);

	render({ url }, { showDrawer, showFab, files }) {
		if (showDrawer) this.enableDrawer = true;
		return (
			<div id="app" class={style.app}>
				<Fab showing={showFab} />

				<Header toggleDrawer={this.toggleDrawer} loadFile={this.loadFile} />
				
				{/* Avoid loading & rendering the drawer until the first time it is shown. */}
				{/*
				<When value={showDrawer}>
					<Drawer showing={showDrawer} openDrawer={this.openDrawer} closeDrawer={this.closeDrawer} />
				</When>
				*/}

				{/*
					Note: this is normally where a <Router> with auto code-splitting goes.
					Since we don't seem to need one (yet?), it's omitted.
				*/}
				<div class={style.content}>
					<Home files={files} />
				</div>

				{/* This ends up in the body when prerendered, which makes it load async. */}
				<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
			</div>
		);
	}
}
