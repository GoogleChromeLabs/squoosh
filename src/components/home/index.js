import { Component } from 'preact';
// import Button from 'preact-material-components/Button';
// import Switch from 'preact-material-components/Switch';
// import 'preact-material-components/Switch/style.css';
import style from './style';


export default class Home extends Component {
	render() {
		return (
			<div class={style.home}>
				<h1>Home</h1>
			</div>
		);
	}
}
