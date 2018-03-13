import { Component } from 'preact';

export function updater(obj, property, value) {
	return e => {
		let update = {};
		update[property] = typeof value === 'function' ? value(obj.state[property], e) : value;
		obj.setState(update);
	};
}

export const toggle = value => !value;

export class When extends Component {
	state = { ready: !!this.props.value };
	render({ value, children: [child] }, { ready }) {
		if (value && !ready) this.setState({ ready: true });
		return ready ? (typeof child === 'function' ? child() : child) : null;
	}
}
