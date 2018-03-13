import { h, Component } from 'preact';
import Icon from 'preact-material-components/Icon';
import 'preact-material-components/Icon/style.css';
import Fab from 'preact-material-components/Fab';
import RadialProgress from 'material-radial-progress';
import style from './style';

export default class AppFab extends Component {
	handleClick = () => {
		console.log('TODO: Save the file to disk.');
		this.setState({ loading: true });
		setTimeout( () => {
			this.setState({ loading: false });
		}, 100000);
	};

	render({}, { loading }) {
		return (
			<Fab ripple secondary class={style.fab} onClick={this.handleClick}>
				{ loading ? (
					<RadialProgress primary class={style.progress} />
				) : (
					<Icon>file_download</Icon>
				) }
			</Fab>
		);
	}
}