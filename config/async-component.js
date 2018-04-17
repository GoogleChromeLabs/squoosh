import { h, Component } from 'preact';

export default function (req) {
  function Async() {
    Component.call(this);

    let b, old;
    this.componentWillMount = () => {
      b = this.base = this.nextBase || this.__b; // short circuits 1st render
      req(m => {
        this.setState({ child: m.default || m });
      });
    };

    this.shouldComponentUpdate = (_, nxt) => {
      nxt = nxt.child === void 0;
      if (nxt && old === void 0 && !!b) {
        old = h(b.nodeName, { dangerouslySetInnerHTML: { __html: b.innerHTML } });
      }
      else {
        old = ''; // dump it
      }
      return !nxt;
    };

    this.render = (p, s) => s.child ? h(s.child, p) : old;
  }
  (Async.prototype = new Component()).constructor = Async;
  return Async;
}