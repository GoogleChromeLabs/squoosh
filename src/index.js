import './style';
import './lib/fix-pmc';
import App from './components/app';

export default App;

if (typeof window!=='undefined') {
	addEventListener('click', e => {
		let { target } = e;
		do {
			if (target.nodeName === 'A') {
				history.pushState(null, null, target.pathname);
				e.preventDefault();
				return false;
			}
		} while ((target = target.parentNode));
	});
}
