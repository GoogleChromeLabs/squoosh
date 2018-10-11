import { h, Component } from 'preact';

import { bind, linkRef, Fileish } from '../../lib/util';

import logo from './imgs/logo.svg';
import largePhoto from './imgs/demos/large-photo.jpg';
import artwork from './imgs/demos/artwork.jpg';
import deviceScreen from './imgs/demos/device-screen.png';
import largePhotoIcon from './imgs/demos/large-photo-icon.jpg';
import artworkIcon from './imgs/demos/artwork-icon.jpg';
import deviceScreenIcon from './imgs/demos/device-screen-icon.jpg';
import logoIcon from './imgs/demos/logo-icon.png';
import * as style from './style.scss';

const demos = [
  {
    description: 'Large photo (2.8mb)',
    filename: 'photo.jpg',
    url: largePhoto,
    iconUrl: largePhotoIcon,
  },
  {
    description: 'Artwork (2.9mb)',
    filename: 'art.jpg',
    url: artwork,
    iconUrl: artworkIcon,
  },
  {
    description: 'Device screen (1.6mb)',
    filename: 'pixel3.png',
    url: deviceScreen,
    iconUrl: deviceScreenIcon,
  },
  {
    description: 'SVG icon (13k)',
    filename: 'squoosh.svg',
    url: logo,
    iconUrl: logoIcon,
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

    // Firefox doesn't like content types like 'image/png; charset=UTF-8', which Webpack's dev
    // server returns. https://bugzilla.mozilla.org/show_bug.cgi?id=1497925.
    const type = /[^;]*/.exec(blob.type)![0];
    const file = new Fileish([blob], demo.filename, { type });
    this.props.onFile(file);
  }

  render({ }: Props, { }: State) {
    return (
      <div class={style.intro}>
        <div>
          <div class={style.logoSizer}>
            <div class={style.logoContainer}>
              <img src={logo} class={style.logo} alt="Squoosh" />
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
                      <div class={style.demoImgAspect}>
                        <img class={style.demoIcon} src={demo.iconUrl} alt=""/>
                      </div>
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
