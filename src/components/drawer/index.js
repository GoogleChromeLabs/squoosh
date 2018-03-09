import { Component } from 'preact';
import MdlDrawer from 'preact-material-components-drawer';
import 'preact-material-components/Drawer/style.css';
import List from 'preact-material-components/List';
// import 'preact-material-components/List/style.css';
import { Text } from 'preact-i18n';
import style from './style';

export default class Drawer extends Component {
	render({ showing, openDrawer, closeDrawer }) {
		return (
			<MdlDrawer open={showing} onOpen={openDrawer} onClose={closeDrawer}>
				<MdlDrawer.Header autosize class="mdc-theme--primary-bg">
					<img class={style.logo} alt="logo" src="/assets/icon.png" />
				</MdlDrawer.Header>
				<MdlDrawer.Content autosize class={style.list}>
					<List autosize>
						<List.LinkItem href="/">
							<List.ItemIcon>verified_user</List.ItemIcon>
							<Text id="SIGN_IN">Sign In</Text>
						</List.LinkItem>
						<List.LinkItem href="/register">
							<List.ItemIcon>account_circle</List.ItemIcon>
							<Text id="REGISTER">Register</Text>
						</List.LinkItem>
					</List>
				</MdlDrawer.Content>

				<div class={style.bottom} autosize>
					<List.LinkItem href="/preferences">
						<List.ItemIcon>settings</List.ItemIcon>
						<Text id="PREFERENCES">Preferences</Text>
					</List.LinkItem>
				</div>
			</MdlDrawer>
		);
	}
}