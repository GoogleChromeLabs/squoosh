import { h, Component } from 'preact';
import Icon from 'preact-material-components/Icon';
import 'preact-material-components/Icon/style.css';
import Fab from 'preact-material-components/Fab';
import RadialProgress from 'material-radial-progress';
import * as style from './style.scss';

type Props = {
	showing: boolean
};
type State = {
	loading: boolean
};

export default class AppFab extends Component<Props, State> {
	state: State = {
		loading: false
	};

	handleClick = () => {
		console.log('TODO: Save the file to disk.');
		this.setState({ loading: true });
		setTimeout( () => {
			this.setState({ loading: false });
		}, 1000);
	};

	render({ showing }, { loading }) {
		return (
			<Fab ripple secondary exited={showing===false} class={style.fab} onClick={this.handleClick}>
				{ loading ? (
					<RadialProgress primary class={style.progress} />
				) : (
					<Icon>file_download</Icon>
				) }
			</Fab>
		);
	}
}