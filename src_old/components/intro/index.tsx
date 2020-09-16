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

const installButtonSource = 'introInstallButton-Purple';

interface Props {
  onFile: (file: File | Fileish) => void;
  showSnack: SnackBarElement['showSnackbar'];
}
interface State {
  fetchingDemoIndex?: number;
  beforeInstallEvent?: BeforeInstallPromptEvent;
}

export default class Intro extends Component<Props, State> {
  state: State = {};
  private fileInput?: HTMLInputElement;
  private installingViaButton = false;

  constructor() {
    super();

    // Listen for beforeinstallprompt events, indicating Squoosh is installable.
    window.addEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );

    // Listen for the appinstalled event, indicating Squoosh has been installed.
    window.addEventListener('appinstalled', this.onAppInstalled);
  }

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
      const blob = await fetch(demo.url).then((r) => r.blob());

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

  @bind
  private onBeforeInstallPromptEvent(event: BeforeInstallPromptEvent) {
    // Don't show the mini-infobar on mobile
    event.preventDefault();

    // Save the beforeinstallprompt event so it can be called later.
    this.setState({ beforeInstallEvent: event });

    // Log the event.
    const gaEventInfo = {
      eventCategory: 'pwa-install',
      eventAction: 'promo-shown',
      nonInteraction: true,
    };
    ga('send', 'event', gaEventInfo);
  }

  @bind
  private async onInstallClick(event: Event) {
    // Get the deferred beforeinstallprompt event
    const beforeInstallEvent = this.state.beforeInstallEvent;
    // If there's no deferred prompt, bail.
    if (!beforeInstallEvent) return;

    this.installingViaButton = true;

    // Show the browser install prompt
    beforeInstallEvent.prompt();

    // Wait for the user to accept or dismiss the install prompt
    const { outcome } = await beforeInstallEvent.userChoice;
    // Send the analytics data
    const gaEventInfo = {
      eventCategory: 'pwa-install',
      eventAction: 'promo-clicked',
      eventLabel: installButtonSource,
      eventValue: outcome === 'accepted' ? 1 : 0,
    };
    ga('send', 'event', gaEventInfo);

    // If the prompt was dismissed, we aren't going to install via the button.
    if (outcome === 'dismissed') {
      this.installingViaButton = false;
    }
  }

  @bind
  private onAppInstalled() {
    // We don't need the install button, if it's shown
    this.setState({ beforeInstallEvent: undefined });

    // Don't log analytics if page is not visible
    if (document.hidden) {
      return;
    }

    // Try to get the install, if it's not set, use 'browser'
    const source = this.installingViaButton ? installButtonSource : 'browser';
    ga('send', 'event', 'pwa-install', 'installed', source);

    // Clear the install method property
    this.installingViaButton = false;
  }

  render({}: Props, { fetchingDemoIndex, beforeInstallEvent }: State) {
    return (
      <div class={style.intro}>
        <div>
          <div class={style.logoSizer}>
            <div class={style.logoContainer}>
              <img
                src={logo}
                class={style.logo}
                alt="Squoosh"
                decoding="async"
              />
            </div>
          </div>
          <p class={style.openImageGuide}>
            Drag &amp; drop or{' '}
            <button class={style.selectButton} onClick={this.onButtonClick}>
              select an image
            </button>
            <input
              class={style.hide}
              ref={linkRef(this, 'fileInput')}
              type="file"
              onChange={this.onFileChange}
            />
          </p>
          <p>Or try one of these:</p>
          <ul class={style.demos}>
            {demos.map((demo, i) => (
              <li key={demo.url} class={style.demoItem}>
                <button
                  class={style.demoButton}
                  onClick={this.onDemoClick.bind(this, i)}
                >
                  <div class={style.demo}>
                    <div class={style.demoImgContainer}>
                      <div class={style.demoImgAspect}>
                        <img
                          class={style.demoIcon}
                          src={demo.iconUrl}
                          alt=""
                          decoding="async"
                        />
                        {fetchingDemoIndex === i && (
                          <div class={style.demoLoading}>
                            <loading-spinner class={style.demoLoadingSpinner} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div class={style.demoDescription}>{demo.description}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {beforeInstallEvent && (
          <button
            type="button"
            class={style.installButton}
            onClick={this.onInstallClick}
          >
            Install
          </button>
        )}
        <ul class={style.relatedLinks}>
          <li>
            <a href="https://github.com/GoogleChromeLabs/squoosh/">
              View the code
            </a>
          </li>
          <li>
            <a href="https://github.com/GoogleChromeLabs/squoosh/issues">
              Report a bug
            </a>
          </li>
          <li>
            <a href="https://github.com/GoogleChromeLabs/squoosh/blob/dev/README.md#privacy">
              Privacy
            </a>
          </li>
        </ul>
      </div>
    );
  }
}
