import { h, Component } from 'preact';

import { bind, linkRef, Fileish } from '../../lib/initial-util';
import '../custom-els/LoadingSpinner';

import logo from './imgs/logo.svg';
import largePhoto from './imgs/demos/demo-large-photo.jpg';
import artwork from './imgs/demos/demo-artwork.jpg';
import deviceScreen from './imgs/demos/demo-device-screen.png';
import largePhotoIcon from './imgs/demos/icon-demo-large-photo.jpg';
import artworkIcon from './imgs/demos/icon-demo-artwork.jpg';
import deviceScreenIcon from './imgs/demos/icon-demo-device-screen.jpg';
import logoIcon from './imgs/demos/icon-demo-logo.png';
import * as style from './style.scss';
import SnackBarElement from '../../lib/SnackBar';

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
  showSnack: SnackBarElement['showSnackbar'];
}
interface State {
  fetchingDemoIndex?: number;
}

export default class Intro extends Component<Props, State> {
  state: State = {};
  private fileInput?: HTMLInputElement;

  @bind
  private resetFileInput() {
    this.fileInput!.value = '';
  }

  @bind
  private onFileChange(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    this.resetFileInput();
    this.props.onFile(file);
  }

  @bind
  private onButtonClick() {
    this.fileInput!.click();
  }

  @bind
  private async onDemoClick(index: number, event: Event) {
    try {
      this.setState({ fetchingDemoIndex: index });
      const demo = demos[index];
      const blob = await fetch(demo.url).then(r => r.blob());

      // Firefox doesn't like content types like 'image/png; charset=UTF-8', which Webpack's dev
      // server returns. https://bugzilla.mozilla.org/show_bug.cgi?id=1497925.
      const type = /[^;]*/.exec(blob.type)![0];
      const file = new Fileish([blob], demo.filename, { type });
      this.props.onFile(file);
    } catch (err) {
      this.setState({ fetchingDemoIndex: undefined });
      this.props.showSnack("Couldn't fetch demo image");
    }
  }

  render({ }: Props, { fetchingDemoIndex }: State) {
    return (
      <div class={style.intro}>
        <div>
          <div class={style.logoSizer}>
            <div class={style.logoContainer}>
              <img src={logo} class={style.logo} alt="Squoosh" decoding="async" />
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
                        <img class={style.demoIcon} src={demo.iconUrl} alt="" decoding="async" />
                        {fetchingDemoIndex === i &&
                          <div class={style.demoLoading}>
                            <loading-spinner class={style.demoLoadingSpinner}/>
                          </div>
                        }
                      </div>
                    </div>
                    <div class={style.demoDescription}>{demo.description}</div>
                  </div>
                </button>
              </li>,
            )}
          </ul>
        </div>
        <ul class={style.relatedLinks}>
          <li><a href="https://github.com/GoogleChromeLabs/squoosh/">View the code</a></li>
          <li><a href="https://github.com/GoogleChromeLabs/squoosh/issues">Report a bug</a></li>
          <li>
            <a href="https://github.com/GoogleChromeLabs/squoosh/blob/master/README.md#privacy">
              Privacy
            </a>
          </li>
        </ul>
      </div>
    );
  }
}
