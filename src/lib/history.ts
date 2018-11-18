export default {
  addPopStateListener(callback: EventListener) {
    window.addEventListener.call(window, 'popstate', callback);
  },
  removePopStateListener(callback: EventListener) {
    window.removeEventListener.call(window, 'popstate', callback);
  },
  push(path: string) {
    window.history.pushState(null, '', path);
  },
  replace(path: string) {
    window.history.replaceState(null, '', path);
  },
};
