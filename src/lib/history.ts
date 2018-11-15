export default {
  on: window.addEventListener.bind(window),
  off: window.removeEventListener.bind(window),
  pathname: window.location.pathname,
  push(path: string) {
    window.history.pushState(null, '', path);
  },
  replace(path: string) {
    window.history.replaceState(null, '', path);
  },
};
