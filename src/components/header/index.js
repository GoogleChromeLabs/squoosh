import { Component } from 'preact';
import Toolbar from 'preact-material-components/Toolbar';
// import 'preact-material-components/Toolbar/mdc-toolbar.scss';
// import Icon from 'preact-material-components/Icon';
// import 'preact-material-components/Icon/style.css';
// import Fab from 'preact-material-components/Fab';
// import 'preact-material-components/Fab/mdc-fab.scss';
import style from './style';

export default class Header extends Component {
	// fabClick = () => {
	// 	alert("Hello");
	// };

	render({ toggleDrawer, showHeader, showFab }) {
		return (
			<Toolbar class={`${style.toolbar} ${showHeader === false ? style.minimal : ''} inert`} fixed>
				<Toolbar.Row>
					<Toolbar.Title autosize class={style.title}>
						<img class={style.logo} src="/assets/icon.png" />
					</Toolbar.Title>
					<Toolbar.Section autosize align-end>
						<Toolbar.Icon autosize menu onClick={toggleDrawer}>menu</Toolbar.Icon>
					</Toolbar.Section>
				</Toolbar.Row>

				{/*
				<Fab class={style.fab} exited={showFab===false} ripple onClick={this.fabClick}>
					<Icon>create</Icon>
				</Fab>
				*/}
			</Toolbar>
		);
	}
}