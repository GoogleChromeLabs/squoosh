import { h, Component, Fragment, createRef } from 'preact';
import type {
  default as PinchZoom,
  ScaleToOpts,
} from '../Output/custom-els/PinchZoom';
import '../Output/custom-els/PinchZoom';
import * as style from './style.css';
import 'add-css:./style.css';
import {
  AddIcon,
  CheckmarkIcon,
  CompareIcon,
  FlipHorizontallyIcon,
  FlipVerticallyIcon,
  RemoveIcon,
  RotateClockwiseIcon,
  RotateCounterClockwiseIcon,
  SwapIcon,
} from '../../icons';
import { cleanSet } from '../../util/clean-modify';
import type { SourceImage } from '../../Compress';
import { PreprocessorState } from 'client/lazy-app/feature-meta';
import Cropper, { CropBox } from './Cropper';
import CanvasImage from '../CanvasImage';
import Select from '../Options/Select';
import Checkbox from '../Options/Checkbox';

const ROTATE_ORIENTATIONS = [0, 90, 180, 270] as const;

const cropPresets = {
  square: {
    name: 'Square',
    ratio: 1,
  },
  '4:3': {
    name: '4:3',
    ratio: 4 / 3,
  },
  '16:9': {
    name: '16:9',
    ratio: 16 / 9,
  },
  '16:10': {
    name: '16:10',
    ratio: 16 / 10,
  },
};

type CropPresetId = keyof typeof cropPresets;

interface Props {
  source: SourceImage;
  preprocessorState: PreprocessorState;
  mobileView: boolean;
  onCancel?(): void;
  onSave?(e: { preprocessorState: PreprocessorState }): void;
}

interface State {
  scale: number;
  editingScale: boolean;
  rotate: typeof ROTATE_ORIENTATIONS[number];
  crop: CropBox;
  cropPreset: keyof typeof cropPresets | undefined;
  lockAspect: boolean;
  flip: PreprocessorState['flip'];
}

const scaleToOpts: ScaleToOpts = {
  originX: '50%',
  originY: '50%',
  relativeTo: 'container',
  allowChangeEvent: true,
};

export default class Transform extends Component<Props, State> {
  state: State = {
    scale: 1,
    editingScale: false,
    cropPreset: undefined,
    lockAspect: false,
    ...this.fromPreprocessorState(this.props.preprocessorState),
  };
  pinchZoom = createRef<PinchZoom>();
  scaleInput = createRef<HTMLInputElement>();

  componentWillReceiveProps(
    { source, preprocessorState }: Props,
    { crop, cropPreset }: State,
  ) {
    if (preprocessorState !== this.props.preprocessorState) {
      this.setState(this.fromPreprocessorState(preprocessorState));
    }
    const { width, height } = source.decoded;
    if (crop) {
      const cropWidth = width - crop.left - crop.right;
      const cropHeight = height - crop.top - crop.bottom;
      for (const [id, preset] of Object.entries(cropPresets)) {
        if (cropHeight * preset.ratio === cropWidth) {
          if (cropPreset !== id) {
            this.setState({ cropPreset: id as CropPresetId });
          }
          break;
        }
      }
    }
  }

  private fromPreprocessorState(preprocessorState?: PreprocessorState) {
    const state: Pick<State, 'rotate' | 'crop' | 'flip'> = {
      rotate: preprocessorState ? preprocessorState.rotate.rotate : 0,
      crop: Object.assign(
        {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
        (preprocessorState && preprocessorState.crop) || {},
      ),
      flip: Object.assign(
        {
          horizontal: false,
          vertical: false,
        },
        (preprocessorState && preprocessorState.flip) || {},
      ),
    };
    return state;
  }

  private save = () => {
    const { preprocessorState, onSave } = this.props;
    const { rotate, crop, flip } = this.state;

    let newState = cleanSet(preprocessorState, 'rotate.rotate', rotate);
    newState = cleanSet(newState, 'crop', crop);
    newState = cleanSet(newState, 'flip', flip);

    if (onSave) onSave({ preprocessorState: newState });
  };

  private cancel = () => {
    const { onCancel, onSave } = this.props;
    if (onCancel) onCancel();
    else if (onSave)
      onSave({ preprocessorState: this.props.preprocessorState });
  };

  private zoomIn = () => {
    if (!this.pinchZoom.current) throw Error('Missing pinch-zoom element');
    this.pinchZoom.current.scaleTo(this.state.scale * 1.25, scaleToOpts);
  };

  private zoomOut = () => {
    if (!this.pinchZoom.current) throw Error('Missing pinch-zoom element');
    this.pinchZoom.current.scaleTo(this.state.scale / 1.25, scaleToOpts);
  };

  private onScaleValueFocus = () => {
    this.setState({ editingScale: true }, () => {
      if (this.scaleInput.current) {
        // Firefox unfocuses the input straight away unless I force a style
        // calculation here. I have no idea why, but it's late and I'm quite
        // tired.
        getComputedStyle(this.scaleInput.current).transform;
        this.scaleInput.current.focus();
      }
    });
  };

  private onScaleInputBlur = () => {
    this.setState({ editingScale: false });
  };

  private onScaleInputChanged = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const percent = parseFloat(target.value);
    if (isNaN(percent)) return;
    if (!this.pinchZoom.current) throw Error('Missing pinch-zoom element');

    this.pinchZoom.current.scaleTo(percent / 100, scaleToOpts);
  };

  private onPinchZoomChange = () => {
    if (!this.pinchZoom.current) throw Error('Missing pinch-zoom element');
    this.setState({
      scale: this.pinchZoom.current.scale,
    });
  };

  private onCropChange = (crop: CropBox) => {
    this.setState({ crop });
  };

  private onCropPresetChange = (event: Event) => {
    const { value } = event.target as HTMLSelectElement;
    const cropPreset = value ? (value as keyof typeof cropPresets) : undefined;
    const crop = { ...this.state.crop };
    if (cropPreset) {
      const preset = cropPresets[cropPreset];
      const { width, height } = this.props.source.decoded;
      const w = width - crop.left - crop.right;
      const h = w / preset.ratio;
      crop.bottom = height - crop.top - h;
      if (crop.bottom < 0) {
        crop.top += crop.bottom;
        crop.bottom = 0;
      }
    }
    this.setState({
      crop,
      cropPreset,
      lockAspect: !!cropPreset,
    });
  };

  private swapCropDimensions = () => {
    const { width, height } = this.props.source.decoded;
    let { left, right, top, bottom } = this.state.crop;
    const cropWidth = width - left - right;
    const cropHeight = height - top - bottom;
    const centerX = left - right;
    const centerY = top - bottom;
    const crop = {
      top: (width - cropWidth) / 2 + centerY / 2,
      bottom: (width - cropWidth) / 2 - centerY / 2,
      left: (height - cropHeight) / 2 + centerX / 2,
      right: (height - cropHeight) / 2 - centerX / 2,
    };
    this.setCrop(crop);
  };

  private setCrop(crop: CropBox) {
    if (crop.top < 0) {
      crop.bottom += crop.top;
      crop.top = 0;
    }
    if (crop.bottom < 0) {
      crop.top += crop.bottom;
      crop.bottom = 0;
    }
    if (crop.left < 0) {
      crop.right += crop.left;
      crop.left = 0;
    }
    if (crop.right < 0) {
      crop.left += crop.right;
      crop.right = 0;
    }
    if (crop.left < 0 || crop.right < 0) crop.left = crop.right = 0;
    if (crop.top < 0 || crop.bottom < 0) crop.top = crop.bottom = 0;
    this.setState({ crop });
  }

  private adjustOffsetAfterRotation = (wideToTall: boolean) => {
    const image = this.props.source.decoded;
    let { x, y } = this.pinchZoom.current!;
    let { width, height } = image;
    if (wideToTall) {
      [width, height] = [height, width];
    }
    x += (width - height) / 2;
    y += (height - width) / 2;
    this.pinchZoom.current!.setTransform({ x, y });
  };

  private rotateClockwise = () => {
    let { rotate, crop } = this.state;
    this.setState(
      {
        rotate: ((rotate + 90) % 360) as typeof ROTATE_ORIENTATIONS[number],
      },
      () => {
        this.adjustOffsetAfterRotation(rotate === 0 || rotate === 180);
      },
    );
    this.setCrop({
      top: crop.left,
      left: crop.bottom,
      bottom: crop.right,
      right: crop.top,
    });
  };

  private rotateCounterClockwise = () => {
    let { rotate, crop } = this.state;
    this.setState(
      {
        rotate: (rotate
          ? rotate - 90
          : 270) as typeof ROTATE_ORIENTATIONS[number],
      },
      () => {
        this.adjustOffsetAfterRotation(rotate === 0 || rotate === 180);
      },
    );
    this.setCrop({
      top: crop.right,
      right: crop.bottom,
      bottom: crop.left,
      left: crop.top,
    });
  };

  private flipHorizontally = () => {
    const { horizontal, vertical } = this.state.flip;
    this.setState({ flip: { horizontal: !horizontal, vertical } });
  };

  private flipVertically = () => {
    const { horizontal, vertical } = this.state.flip;
    this.setState({ flip: { horizontal, vertical: !vertical } });
  };

  private toggleLockAspect = () => {
    this.setState({ lockAspect: !this.state.lockAspect });
  };

  private setCropWidth = (
    event: preact.JSX.TargetedEvent<HTMLInputElement, Event>,
  ) => {
    const { width, height } = this.props.source.decoded;
    const newWidth = Math.min(width, parseInt(event.currentTarget.value, 10));
    let { top, right, bottom, left } = this.state.crop;
    const aspect = (width - left - right) / (height - top - bottom);
    right = width - newWidth - left;
    if (this.state.lockAspect) {
      const newHeight = newWidth / aspect;
      if (newHeight > height) return;
      bottom = height - newHeight - top;
    }
    this.setCrop({ top, right, bottom, left });
  };

  private setCropHeight = (
    event: preact.JSX.TargetedEvent<HTMLInputElement, Event>,
  ) => {
    const { width, height } = this.props.source.decoded;
    const newHeight = Math.min(height, parseInt(event.currentTarget.value, 10));
    let { top, right, bottom, left } = this.state.crop;
    const aspect = (width - left - right) / (height - top - bottom);
    bottom = height - newHeight - top;
    if (this.state.lockAspect) {
      const newWidth = newHeight * aspect;
      if (newWidth > width) return;
      right = width - newWidth - left;
    }
    this.setCrop({ top, right, bottom, left });
  };

  render(
    { mobileView, source }: Props,
    { scale, editingScale, rotate, flip, crop, cropPreset, lockAspect }: State,
  ) {
    const image = source.decoded;
    const rotated = rotate === 90 || rotate === 270;

    const displayWidth = rotated ? image.height : image.width;
    const displayHeight = rotated ? image.width : image.height;

    const width = displayWidth - crop.left - crop.right;
    const height = displayHeight - crop.top - crop.bottom;

    let transform =
      `translate(-50%, -50%) ` +
      `rotate(${rotate}deg) ` +
      `scale(${flip.horizontal ? -1 : 1}, ${flip.vertical ? -1 : 1})`;

    return (
      <Fragment>
        <CancelButton onClick={this.cancel} />
        <SaveButton onClick={this.save} />

        <div class={style.transform}>
          <pinch-zoom
            class={style.pinchZoom}
            onChange={this.onPinchZoomChange}
            ref={this.pinchZoom}
          >
            <div
              class={style.wrap}
              style={{
                width: displayWidth,
                height: displayHeight,
              }}
            >
              <CanvasImage
                class={style.pinchTarget}
                image={image}
                style={{ transform }}
              />
              {crop && (
                <Cropper
                  size={{ width: displayWidth, height: displayHeight }}
                  scale={scale}
                  lockAspect={lockAspect}
                  crop={crop}
                  onChange={this.onCropChange}
                />
              )}
            </div>
          </pinch-zoom>
        </div>

        <div class={style.controls}>
          <div class={style.zoomControls}>
            <button class={style.button} onClick={this.zoomOut}>
              <RemoveIcon />
            </button>
            {editingScale ? (
              <input
                type="number"
                step="1"
                min="1"
                max="1000000"
                ref={this.scaleInput}
                class={style.zoom}
                value={Math.round(scale * 100)}
                onInput={this.onScaleInputChanged}
                onBlur={this.onScaleInputBlur}
              />
            ) : (
              <span
                class={style.zoom}
                tabIndex={0}
                onFocus={this.onScaleValueFocus}
              >
                <span class={style.zoomValue}>{Math.round(scale * 100)}</span>%
              </span>
            )}
            <button class={style.button} onClick={this.zoomIn}>
              <AddIcon />
            </button>
          </div>
        </div>

        <div class={style.options}>
          <h3 class={style.optionsTitle}>Modify Source</h3>

          <div class={style.optionsSection}>
            <h4 class={style.optionsSectionTitle}>Crop</h4>
            <div class={style.optionOneCell}>
              <Select
                large
                value={cropPreset}
                onChange={this.onCropPresetChange}
              >
                <option value="">Custom</option>
                {Object.entries(cropPresets).map(([type, preset]) => (
                  <option value={type}>{preset.name}</option>
                ))}
              </Select>
            </div>
            <label class={style.optionCheckbox}>
              <Checkbox checked={lockAspect} onClick={this.toggleLockAspect} />
              Lock aspect-ratio
            </label>
            <div class={style.optionsDimensions}>
              <input
                type="number"
                name="width"
                value={width}
                title="Crop width"
                onInput={this.setCropWidth}
              />
              <button
                class={style.optionsButton}
                title="swap"
                onClick={this.swapCropDimensions}
              >
                <SwapIcon />
              </button>
              <input
                type="number"
                name="height"
                value={height}
                title="Crop height"
                onInput={this.setCropHeight}
              />
            </div>

            <div class={style.optionButtonRow}>
              Flip
              <button
                class={style.optionsButton}
                data-active={flip.vertical}
                title="Flip vertically"
                onClick={this.flipVertically}
              >
                <FlipVerticallyIcon />
              </button>
              <button
                class={style.optionsButton}
                data-active={flip.horizontal}
                title="Flip horizontally"
                onClick={this.flipHorizontally}
              >
                <FlipHorizontallyIcon />
              </button>
            </div>

            <div class={style.optionButtonRow}>
              Rotate
              <button
                class={style.optionsButton}
                title="Rotate clockwise"
                onClick={this.rotateClockwise}
              >
                <RotateClockwiseIcon />
              </button>
              <button
                class={style.optionsButton}
                title="Rotate counter-clockwise"
                onClick={this.rotateCounterClockwise}
              >
                <RotateCounterClockwiseIcon />
              </button>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const CancelButton = ({ onClick }: { onClick: () => void }) => (
  <button class={style.cancel} onClick={onClick}>
    <svg viewBox="0 0 80 80" width="80" height="80">
      <path d="M8.06 40.98c-.53-7.1 4.05-14.52 9.98-19.1s13.32-6.35 22.13-6.43c8.84-.12 19.12 1.51 24.4 7.97s5.6 17.74 1.68 26.97c-3.89 9.26-11.97 16.45-20.46 18-8.43 1.55-17.28-2.62-24.5-8.08S8.54 48.08 8.07 40.98z" />
    </svg>
    <CompareIcon class={style.icon} />
    <span>Cancel</span>
  </button>
);

const SaveButton = ({ onClick }: { onClick: () => void }) => (
  <button class={style.save} onClick={onClick}>
    <svg viewBox="0 0 89 87" width="89" height="87">
      <path
        fill="#0c99ff"
        opacity=".7"
        d="M27.3 71.9c-8-4-15.6-12.3-16.9-21-1.2-8.7 4-17.8 10.5-26s14.4-15.6 24-16 21.2 6 28.6 16.5c7.4 10.5 10.8 25 6.6 34S64.1 71.7 54 73.5c-10.2 2-18.7 2.3-26.7-1.6z"
      />
      <path
        fill="#0c99ff"
        opacity=".7"
        d="M14.6 24.8c4.3-7.8 13-15 21.8-15.7 8.7-.8 17.5 4.8 25.4 11.8 7.8 6.9 14.8 15.2 14.8 24.9s-7.2 20.7-18 27.6c-10.9 6.8-25.6 9.5-34.3 4.8S13 61.6 11.6 51.4c-1.3-10.3-1.3-18.8 3-26.6z"
      />
    </svg>
    <CheckmarkIcon class={style.icon} />
  </button>
);
