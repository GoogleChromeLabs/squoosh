import { h, Component } from 'preact';

import { bind, linkRef, Fileish } from '../../lib/util';

import logo from './imgs/logo.svg';
import largePhoto from './imgs/demos/large-photo.jpg';
import artwork from './imgs/demos/artwork.jpg';
import deviceScreen from './imgs/demos/device-screen.png';
import * as style from './style.scss';

const demos = [
  {
    description: 'Large photo (2.8mb)',
    filename: 'photo.jpg',
    url: largePhoto,
  },
  {
    description: 'Artwork (2.9mb)',
    filename: 'art.jpg',
    url: artwork,
  },
  {
    description: 'Device screen (1.6mb)',
    filename: 'pixel3.png',
    url: deviceScreen,
  },
  {
    description: 'SVG icon (13k)',
    filename: 'squoosh.svg',
    url: logo,
  },
];

interface Props {
  onFile: (file: File | Fileish) => void;
}
interface State {}

export default class Intro extends Component<Props, State> {
  private fileInput?: HTMLInputElement;

  @bind
  private onFileChange(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    this.props.onFile(file);
  }

  @bind
  private onButtonClick() {
    this.fileInput!.click();
  }

  @bind
  private async onDemoClick(index: number, event: Event) {
    const demo = demos[index];
    const blob = await fetch(demo.url).then(r => r.blob());
    const file = new Fileish([blob], demo.filename, { type: blob.type });
    this.props.onFile(file);
  }

  render({ }: Props, { }: State) {
    return (
      <div class={style.intro}>
        <div>
          <div class={style.logoSizer}>
            <div class={style.logoContainer}>
              <img src={logo} class={style.logo} />
            </div>
          </div>
          <p class={style.openImageGuide}>
            Drag &amp; drop or{' '}
            <button class={style.selectButton} onClick={this.onButtonClick}>select an image</button>
            <input
              class={style.hide}
              ref={linkRef(this, 'fileInput')}
              type="file"
              onChange={this.onFileChange}
            />
          </p>
          <p>Or try one of these:</p>
          <ul class={style.demos}>
            {demos.map((demo, i) =>
              <li key={demo.url} class={style.demoItem}>
                <button class={style.demoButton} onClick={this.onDemoClick.bind(this, i)}>
                  <div class={style.demo}>
                    <div class={style.demoImgContainer}>
                      <div class={style.demoImgAspect}/>
                    </div>
                    <div class={style.demoDescription}>{demo.description}</div>
                  </div>
                </button>
              </li>,
            )}
          </ul>
        </div>
      </div>
    );
  }
}
