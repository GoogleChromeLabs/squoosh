import { h, Component } from 'preact';
// import Button from 'preact-material-components/Button';
// import Switch from 'preact-material-components/Switch';
// import 'preact-material-components/Switch/style.css';
import * as style from './style.scss';

type Props = {
	files: {
		data: any
	}[]
};
type State = {
	active: boolean
};

export default class Home extends Component<Props, State> {
	state: State = {
		active: false
	};

	componentDidMount() {
		setTimeout( () => {
			this.setState({ active: true });
		});
	}

	render({ files }, { active }) {
		return (
			<div class={style.home+' '+(active ? style.active : '')}>
				{ files && files[0] && (
					<img src={files[0].data} />
				) }
			</div>
		);
	}
}
