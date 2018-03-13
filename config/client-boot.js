import { h, render } from 'preact';

if (process.env.NODE_ENV === 'development') {
	// enable preact devtools
	require('preact/debug');
}
else if (process.env.ADD_SW && 'serviceWorker' in navigator && location.protocol === 'https:') {
	// eslint-disable-next-line no-undef
	navigator.serviceWorker.register(__webpack_public_path__ + 'sw.js');
}

const interopDefault = m => m && m.default ? m.default : m;

let app = interopDefault(require('app-entry-point'));

if (typeof app === 'function') {
	let root = document.getElementById('app') || document.body.firstElementChild;

	let init = () => {
		let app = interopDefault(require('app-entry-point'));
		root = render(h(app), document.body, root);
	};

	if (module.hot) module.hot.accept('app-entry-point', init);

	init();
}
