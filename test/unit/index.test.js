/* eslint-env jest */

import { h, Component, render } from 'preact';
import App from '../../src/components/app';

describe('<App />', () => {
  let scratch;
  beforeEach(() => {
    scratch = document.createElement('div');
    document.body.appendChild(scratch);
  });
  afterEach(() => {
    render(<span />, scratch, scratch.firstChild);
    scratch.remove();
  });

  it('should render', () => {
    let app;
    render(<App ref={c => { app = c; }} />, scratch);

    expect(app instanceof Component).toBe(true);

    expect(scratch.innerHTML).toBe(
      `<div id="app" class="app__1wROX"><div><h1>Select an image</h1><input type="file"></div></div>`
    );
  });
});
