export default {
  addPopStateListener(callback: EventListener) {
    window.addEventListener.call(window, 'popstate', callback);
  },
  push(path: string) {
    window.history.pushState(null, '', path);
  },
  back: window.history.back.bind(window.history),
  get pathname() {
    return window.location.pathname;
  },
};
