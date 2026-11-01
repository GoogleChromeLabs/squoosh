<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { showSnack } from '@/composables/useSnackbar';
import SlideOnScroll from './SlideOnScroll.vue';
import { startBlobs } from './blob-anim/meta';
import githubLogo from './imgs/github-logo.svg';
import logoWithText from './imgs/logo-with-text.svg';
import logo from './imgs/logo.svg';
import largePhoto from './imgs/demos/demo-large-photo.jpg';
import artwork from './imgs/demos/demo-artwork.jpg';
import deviceScreen from './imgs/demos/demo-device-screen.png';
import largePhotoIcon from './imgs/demos/icon-demo-large-photo.jpg';
import artworkIcon from './imgs/demos/icon-demo-artwork.jpg';
import deviceScreenIcon from './imgs/demos/icon-demo-device-screen.jpg';
import logoIcon from './imgs/demos/icon-demo-logo.png';
import smallSectionAsset from './imgs/info-content/small.svg';
import simpleSectionAsset from './imgs/info-content/simple.svg';
import secureSectionAsset from './imgs/info-content/secure.svg';

const emit = defineEmits<{ file: [file: File] }>();

const demos = [
  {
    description: 'Large photo',
    size: '2.8MB',
    filename: 'photo.jpg',
    url: largePhoto,
    iconUrl: largePhotoIcon,
  },
  {
    description: 'Artwork',
    size: '2.9MB',
    filename: 'art.jpg',
    url: artwork,
    iconUrl: artworkIcon,
  },
  {
    description: 'Device screen',
    size: '1.6MB',
    filename: 'pixel3.png',
    url: deviceScreen,
    iconUrl: deviceScreenIcon,
  },
  {
    description: 'SVG icon',
    size: '13KB',
    filename: 'squoosh.svg',
    url: logo,
    iconUrl: logoIcon,
  },
] as const;

const repoUrl = 'https://github.com/Pinguin2001/squoosh';

const blobAnimImport = matchMedia('(prefers-reduced-motion: reduce)').matches
  ? undefined
  : import('./blob-anim');

const supportsClipboardAPI = !!navigator.clipboard?.read;

/** The SVG path for each of the static blobs behind the load button. */
const blobPaths = startBlobs.map((points) =>
  points
    .map((point, i) => {
      const nextI = i === points.length - 1 ? 0 : i + 1;
      let d = '';
      if (i === 0) {
        d += `M${point[2]} ${point[3]}`;
      }
      return (
        d +
        `C${point[4]} ${point[5]} ${points[nextI][0]} ${points[nextI][1]} ${points[nextI][2]} ${points[nextI][3]}`
      );
    })
    .join(''),
);

const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
const blobCanvas = useTemplateRef<HTMLCanvasElement>('blobCanvas');
const loadImg = useTemplateRef<HTMLElement>('loadImg');

const fetchingDemoIndex = ref<number>();
const beforeInstallEvent = ref<BeforeInstallPromptEvent>();
/** The static blobs show until the animated ones take over. */
const showBlobSVG = ref(true);

function onBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
  // Don't show the mini-infobar on mobile
  event.preventDefault();
  // Save the beforeinstallprompt event so it can be called later.
  beforeInstallEvent.value = event;
}

function onAppInstalled() {
  // We don't need the install button, if it's shown
  beforeInstallEvent.value = undefined;
}

onMounted(async () => {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', onAppInstalled);

  if (!blobAnimImport) return;
  const { startBlobAnim } = await blobAnimImport;
  // Unmounted in the meantime?
  if (!blobCanvas.value) return;
  showBlobSVG.value = false;
  startBlobAnim(blobCanvas.value, loadImg.value!);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.removeEventListener('appinstalled', onAppInstalled);
});

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.value = '';
  emit('file', file);
}

async function onDemoClick(index: number) {
  try {
    fetchingDemoIndex.value = index;
    const demo = demos[index];
    const blob = await fetch(demo.url).then((r) => r.blob());
    emit('file', new File([blob], demo.filename, { type: blob.type }));
  } catch {
    fetchingDemoIndex.value = undefined;
    showSnack("Couldn't fetch demo image");
  }
}

async function onInstallClick() {
  // Show the browser install prompt
  await beforeInstallEvent.value?.prompt();
}

async function onPasteClick() {
  let clipboardItems: ClipboardItem[];

  try {
    clipboardItems = await navigator.clipboard.read();
  } catch {
    showSnack('No permission to access clipboard');
    return;
  }

  for (const item of clipboardItems) {
    const type = item.types.find((type) => type.startsWith('image/'));
    if (!type) continue;
    emit('file', new File([await item.getType(type)], 'image.unknown'));
    return;
  }

  showSnack('No image found in the clipboard');
}
</script>

<template>
  <div class="intro abs-fill">
    <input ref="fileInput" class="hide" type="file" @change="onFileChange" />
    <div class="main">
      <canvas ref="blobCanvas" class="blob-canvas abs-fill" />
      <h1 class="logo-container">
        <img
          class="logo"
          :src="logoWithText"
          alt="Squoosh"
          width="539"
          height="162"
        />
      </h1>
      <div ref="loadImg" class="load-img">
        <svg
          v-if="showBlobSVG"
          class="blob-svg abs-fill"
          viewBox="-1.25 -1.25 2.5 2.5"
          preserveAspectRatio="xMidYMid slice"
        >
          <path v-for="(d, i) in blobPaths" :key="i" :d="d" />
        </svg>
        <div class="load-img-content">
          <button class="unbutton load-btn" @click="fileInput!.click()">
            <svg viewBox="0 0 24 24" class="load-icon">
              <path
                d="M19 7v3h-2V7h-3V5h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5a2 2 0 00-2 2v12c0 1.1.9 2 2 2h12a2 2 0 002-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"
              />
            </svg>
          </button>
          <div>
            <span class="drop-text">Drop </span>OR
            <button
              v-if="supportsClipboardAPI"
              class="unbutton paste-btn"
              @click="onPasteClick"
            >
              Paste
            </button>
            <template v-else>Paste</template>
          </div>
        </div>
      </div>
    </div>
    <div class="demos-container">
      <svg viewBox="0 0 1920 140" class="top-wave">
        <path
          d="M1920 0l-107 28c-106 29-320 85-533 93-213 7-427-36-640-50s-427 0-533 7L0 85v171h1920z"
          class="sub-wave"
        />
        <path
          d="M0 129l64-26c64-27 192-81 320-75 128 5 256 69 384 64 128-6 256-80 384-91s256 43 384 70c128 26 256 26 320 26h64v96H0z"
          class="main-wave"
        />
      </svg>
      <div class="content-padding">
        <p class="demo-title">Or <strong>try one</strong> of these:</p>
        <ul class="demos">
          <li v-for="(demo, i) in demos" :key="demo.filename">
            <button class="unbutton" @click="onDemoClick(i)">
              <div class="demo-container">
                <div class="demo-icon-container">
                  <img
                    class="demo-icon"
                    :src="demo.iconUrl"
                    :alt="demo.description"
                  />
                  <div
                    v-if="fetchingDemoIndex === i"
                    class="demo-loader abs-fill"
                  >
                    <LoadingSpinner />
                  </div>
                </div>
                <div class="demo-size">{{ demo.size }}</div>
              </div>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div class="bottom-wave">
      <svg viewBox="0 0 1920 79" class="top-wave">
        <path
          d="M0 59l64-11c64-11 192-34 320-43s256-5 384 4 256 23 384 34 256 21 384 14 256-30 320-41l64-11v94H0z"
          class="info-wave"
        />
      </svg>
    </div>

    <section class="info">
      <div class="info-container">
        <SlideOnScroll>
          <div class="info-content">
            <div class="info-text-wrapper">
              <h2 class="info-title">Small</h2>
              <p class="info-caption">
                Smaller images mean faster load times. Squoosh can reduce file
                size and maintain high quality.
              </p>
            </div>
            <div class="info-img-wrapper">
              <img
                class="info-img"
                :src="smallSectionAsset"
                alt="silhouette of a large 1.4 megabyte image shrunk into a smaller 80 kilobyte image"
                width="536"
                height="522"
              />
            </div>
          </div>
        </SlideOnScroll>
      </div>
    </section>

    <section class="info">
      <div class="info-container">
        <SlideOnScroll>
          <div class="info-content">
            <div class="info-text-wrapper">
              <h2 class="info-title">Simple</h2>
              <p class="info-caption">
                Open your image, inspect the differences, then save instantly.
                Feeling adventurous? Adjust the settings for even smaller files.
              </p>
            </div>
            <div class="info-img-wrapper">
              <img
                class="info-img"
                :src="simpleSectionAsset"
                alt="grid of multiple shrunk images displaying various options"
                width="538"
                height="384"
              />
            </div>
          </div>
        </SlideOnScroll>
      </div>
    </section>

    <section class="info">
      <div class="info-container">
        <SlideOnScroll>
          <div class="info-content">
            <div class="info-text-wrapper">
              <h2 class="info-title">Secure</h2>
              <p class="info-caption">
                Worried about privacy? Images never leave your device since
                Squoosh does all the work locally.
              </p>
            </div>
            <div class="info-img-wrapper">
              <img
                class="info-img"
                :src="secureSectionAsset"
                alt="silhouette of a cloud with a 'no' symbol on top"
                width="498"
                height="333"
              />
            </div>
          </div>
        </SlideOnScroll>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-container">
        <svg viewBox="0 0 1920 79" class="top-wave">
          <path
            d="M0 59l64-11c64-11 192-34 320-43s256-5 384 4 256 23 384 34 256 21 384 14 256-30 320-41l64-11v94H0z"
            class="footer-wave"
          />
        </svg>
        <div class="footer-padding">
          <footer class="footer-items">
            <a
              class="footer-link"
              :href="`${repoUrl}/blob/dev/README.md#privacy`"
            >
              Privacy
            </a>
            <a class="footer-link footer-link-with-logo" :href="repoUrl">
              <img :src="githubLogo" alt="" width="10" height="10" />
              Source on Github
            </a>
          </footer>
        </div>
      </div>
    </footer>
    <button
      v-if="beforeInstallEvent"
      class="unbutton install-btn"
      @click="onInstallClick"
    >
      Install
    </button>
  </div>
</template>

<style scoped>
.intro {
  -webkit-overflow-scrolling: touch;
  overflow: auto;
  overscroll-behavior: contain;
  display: grid;
  grid-template-rows: 1fr max-content max-content;
  font-size: 1.2rem;
  color: var(--dim-text);
}

.blob-canvas {
  width: 100%;
  height: 100%;
}

.hide {
  display: none;
}

.main {
  min-height: 541px;
  display: grid;
  grid-template-rows: max-content max-content;
  justify-items: center;
  position: relative;
  --blob-pink: var(--hot-pink);
  --center-blob-opacity: 0.3;

  @media (min-width: 600px) {
    min-height: 688px;
  }
}

.logo-container {
  margin: 5rem 0 1rem;
}

.logo {
  transform: translate(-1%, 0);
  width: 189px;
  height: auto;
}

.load-img {
  position: relative;
  color: var(--white);
  font-style: italic;
  font-size: 1.2rem;
}

.blob-svg {
  width: 100%;
  height: 100%;
  fill: var(--blob-pink);

  & path {
    opacity: var(--center-blob-opacity);
  }
}

.load-img-content {
  position: relative;
  --size: 29rem;
  max-width: var(--size);
  width: 100vw;
  height: var(--size);
  display: grid;
  grid-template-rows: max-content max-content;
  justify-items: center;
  align-content: center;
  gap: 0.7rem;

  @media (min-width: 600px) {
    --size: 36rem;
  }
}

.load-btn {
}

.load-icon {
  --size: 5rem;
  width: var(--size);
  height: var(--size);
  fill: var(--white);
  transform: translate(4.3%, -1%);
}

.paste-btn {
  text-decoration: underline;
  font: inherit;
  color: inherit;
}

.demos-container {
  position: relative;
  background: var(--deep-blue);
  padding-bottom: 5.2vw;
}

.top-wave {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
}

.main-wave {
  fill: var(--deep-blue);
}

.sub-wave {
  fill: var(--light-blue);
}

.bottom-wave {
  position: relative;
}

.info {
  background: var(--white);
  position: relative;
  padding: 5em 2em;

  @media (min-width: 1200px) {
    padding: 5em 0;
  }
}

.info-container {
  max-width: 1000px;
  margin: 0 auto;
}

.info-content {
  display: grid;
  align-items: center;
  grid-template-columns: 1fr;
  gap: 1em;

  grid-template-areas:
    'text'
    'img';

  @media (min-width: 712px) {
    grid-template-columns: 1fr 1fr;
    grid-template-areas: 'text img';

    .info:nth-child(even) & {
      grid-template-areas: 'img text';
    }
  }
}

.info-title {
  color: var(--pink);
  font-size: 3em;
  margin: 0;
}

.info-caption {
  font-size: 1.5em;
  line-height: 1.75;
  margin: 1em 0 0.5em 0;
}

.info-link {
  font-size: 1.25em;
  text-underline-offset: 0.25em;
  color: var(--off-black);
  transition: color 400ms ease-in-out;
  margin-top: 1em;
  &:hover {
    color: var(--dim-blue);
  }
}

.info-text-wrapper {
  display: flex;
  flex-flow: column wrap;
  max-width: 27em;
  justify-self: center;
  grid-area: text;

  @media (min-width: 712px) {
    justify-self: start;
    .info:nth-child(even) & {
      text-align: right;
      justify-self: end;
    }
  }
}

.info-img-wrapper {
  grid-area: img;
}

.info-img {
  display: block;
  width: 100%;
  height: auto;
  max-width: 400px;
  margin: 0 auto;

  @media (min-width: 768px) {
    margin: 0 0 0 auto;

    .info:nth-child(even) & {
      margin: 0;
    }
  }
}

.info-wave {
  fill: var(--white);
}

.footer {
  background: var(--white);
  padding-top: 5em;
}

.footer-container {
  position: relative;
  background: var(--light-gray);
}

.footer-wave {
  fill: var(--light-gray);
}

.content-padding {
  padding: 2em 0;
}

.footer-padding {
  padding: 2em;
}

.footer-items {
  display: grid;

  grid-auto-rows: max-content;
  justify-items: center;
  gap: 2rem;

  @media (min-width: 480px) {
    justify-content: end;
    grid-auto-flow: column;
    align-items: center;
    gap: 4rem;
  }
}

.footer-link {
  text-decoration: none;
  color: inherit;
}

.footer-link-with-logo {
  display: grid;
  grid-template-columns: 1.8em max-content;
  align-items: center;
  gap: 0.6em;

  img {
    width: 100%;
    height: auto;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

.install-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--deep-blue);
  border-radius: 0.4em;
  color: var(--white);
  padding: 0.5em 1em;
  font-size: 1.6rem;
  animation: fade-in 600ms ease-in-out;
}

.demo-title {
  color: var(--white);
  margin: 0;
  font-size: 2rem;
  text-align: center;
}

.demos {
  display: grid;
  gap: 3rem;
  justify-items: center;
  justify-content: center;
  padding: 0;
  margin: 3rem auto;
  --demo-size: 80px;
  grid-template-columns: repeat(auto-fit, var(--demo-size));

  @media (min-width: 740px) {
    --demo-size: 100px;
    gap: 6rem;
  }

  & > li {
    display: block;
  }
}

.demo-container {
  transition: scale 400ms ease-in-out;
  &:hover {
    scale: 1.05;
  }
}

.demo-size {
  background: var(--dim-blue);
  border-radius: 1000px;
  color: var(--white);
  width: max-content;
  padding: 0.5rem 1.2rem;
  margin: 0.7rem auto 0;
}

.demo-icon-container {
  border-radius: var(--demo-size);
  position: relative;
  overflow: hidden;
}
.demo-icon {
  width: var(--demo-size);
  height: var(--demo-size);
  display: block;
}
.demo-loader {
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  justify-content: center;
  align-content: center;
  animation: fade-in 600ms ease-in-out;

  & > .loading-spinner {
    --color: var(--white);
  }
}

.drop-text {
  @media (max-width: 599px) {
    display: none;
  }
}
</style>
