import { Component } from 'preact';
import { updater, toggle } from '../../lib/util';
import Fab from '../fab';
import Header from '../header';
import Drawer from '../drawer';
import Home from '../home';
import style from './style';

export default class App extends Component {
	state = {
		showDrawer: false,
		showFab: true
	};

	openDrawer = updater(this, 'showDrawer', true);
	closeDrawer = updater(this, 'showDrawer', false);
	toggleDrawer = updater(this, 'showDrawer', toggle);

	openFab = updater(this, 'showFab', true);
	closeFab = updater(this, 'showFab', false);
	toggleFab = updater(this, 'showFab', toggle);

	render({ url }, { showDrawer, showFab }) {
		return (
			<div id="app" class={style.app}>
				<Fab showing={showFab} />
				<Header toggleDrawer={this.toggleDrawer} />
				<Drawer showing={showDrawer} openDrawer={this.openDrawer} closeDrawer={this.closeDrawer} />
				<div class={style.content} paint-outside>
					<Home />
				</div>
				<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
			</div>
		);
	}
}
