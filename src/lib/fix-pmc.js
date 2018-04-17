import { options } from 'preact';

const classNameDescriptor = {
  enumerable: false,
  configurable: true,
  get () {
    return this.class;
  },
  set (value) {
    this.class = value;
  }
};

const old = options.vnode;
options.vnode = vnode => {
  const a = vnode.attributes;
  if (a != null) {
    if ('className' in a) {
      a.class = a.className;
    }
    if ('class' in a) {
      Object.defineProperty(a, 'className', classNameDescriptor);
    }
  }
  if (old != null) old(vnode);
};
