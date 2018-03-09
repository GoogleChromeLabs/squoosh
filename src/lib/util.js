export function updater(obj, property, value) {
	return e => {
		let update = {};
		update[property] = typeof value === 'function' ? value(obj.state[property], e) : value;
		obj.setState(update);
	};
}

export const toggle = value => !value;

