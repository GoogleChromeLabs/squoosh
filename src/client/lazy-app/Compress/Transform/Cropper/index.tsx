import { h, Component, ComponentChildren, createRef } from 'preact';
import * as style from './style.css';
import 'add-css:./style.css';
import { shallowEqual } from 'client/lazy-app/util';

export interface CropBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Minimum CropBox size
const MIN_SIZE = 2;

export interface Props {
  size: { width: number; height: number };
  scale?: number;
  lockAspect?: boolean;
  crop: CropBox;
  onChange?(crop: CropBox): void;
}

type Edge = keyof CropBox;

interface PointerTrack {
  x: number;
  y: number;
  edges: { edge: Edge; value: number }[];
  aspect: number | undefined;
}

interface State {
  crop: CropBox;
  pan: boolean;
}

export default class Cropper extends Component<Props, State> {
  private pointers = new Map<number, PointerTrack>();

  state = {
    crop: this.normalizeCrop({ ...this.props.crop }),
    pan: false,
  };

  private root = createRef<SVGSVGElement>();

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    if (!shallowEqual(nextState, this.state)) return true;
    const { size, scale, lockAspect, crop } = this.props;
    return (
      size.width !== nextProps.size.width ||
      size.height !== nextProps.size.height ||
      scale !== nextProps.scale ||
      lockAspect !== nextProps.lockAspect ||
      !shallowEqual(crop, nextProps.crop)
    );
  }

  componentDidUpdate() {
    requestAnimationFrame(() => {
      if (!this.root.current) return;
      getComputedStyle(this.root.current);
    });
  }

  componentWillReceiveProps({ crop }: Props, nextState: State) {
    const current = nextState.crop || this.state.crop;
    if (crop !== this.props.crop && !shallowEqual(crop, current)) {
      this.setCrop(crop);
    }
  }

  private normalizeCrop(crop: CropBox) {
    crop.left = Math.round(Math.max(0, crop.left));
    crop.top = Math.round(Math.max(0, crop.top));
    crop.right = Math.round(Math.max(0, crop.right));
    crop.bottom = Math.round(Math.max(0, crop.bottom));
    return crop;
  }

  private setCrop(cropUpdate: Partial<CropBox>) {
    const crop = this.normalizeCrop({ ...this.state.crop, ...cropUpdate });
    // ignore crop updates that normalize to the same values
    const old = this.state.crop;
    if (
      crop.left === old.left &&
      crop.right === old.right &&
      crop.top === old.top &&
      crop.bottom === old.bottom
    ) {
      return;
    }
    this.setState({ crop });
    if (this.props.onChange) {
      this.props.onChange(crop);
    }
  }

  private onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || this.state.pan) return;

    const target = event.target as SVGElement;
    const edgeAttr = target.getAttribute('data-edge');
    if (edgeAttr) {
      event.stopPropagation();
      event.preventDefault();

      let aspect;
      const edges = edgeAttr.split(/ *, */) as Edge[];
      if (this.props.lockAspect) {
        if (edges.length === 1) return;
        const { size } = this.props;
        const oldCrop = this.state.crop;
        aspect =
          (size.width - oldCrop.left - oldCrop.right) /
          (size.height - oldCrop.top - oldCrop.bottom);
      }

      this.pointers.set(event.pointerId, {
        x: event.x,
        y: event.y,
        edges: edges.map((edge) => ({ edge, value: this.state.crop[edge] })),
        aspect,
      });
      target.setPointerCapture(event.pointerId);
    }
  };

  private onPointerMove = (event: PointerEvent) => {
    const target = event.target as SVGElement;
    const down = this.pointers.get(event.pointerId);
    if (down && target.hasPointerCapture(event.pointerId)) {
      const { size } = this.props;
      const oldCrop = this.state.crop;
      const scale = this.props.scale || 1;
      let dx = (event.x - down.x) / scale;
      let dy = (event.y - down.y) / scale;

      if (down.aspect && down.edges.length === 2) {
        const dir = (dx + dy) / 2;
        dx = dir * down.aspect;
        dy = dir / down.aspect;
      }
      const crop: Partial<CropBox> = {};
      for (const { edge, value } of down.edges) {
        let edgeValue = value;
        switch (edge) {
          case 'left':
            edgeValue += dx;
            break;
          case 'right':
            edgeValue -= dx;
            break;
          case 'top':
            edgeValue += dy;
            break;
          case 'bottom':
            edgeValue -= dy;
            break;
        }
        crop[edge] = edgeValue;
      }

      // Prevent MOVE from resizing the cropbox:
      if (crop.left && crop.right) {
        if (crop.left < 0) crop.right += crop.left;
        if (crop.right < 0) crop.left += crop.right;
      } else {
        // enforce minimum 1px cropbox width
        if (crop.left) {
          if (down.aspect) crop.left = Math.max(0, crop.left);
          else
            crop.left = Math.min(
              crop.left,
              size.width - oldCrop.right - MIN_SIZE,
            );
        }
        if (crop.right) {
          if (down.aspect) crop.right = Math.max(0, crop.right);
          crop.right = Math.min(
            crop.right,
            size.width - oldCrop.left - MIN_SIZE,
          );
        }

        if (
          down.aspect &&
          (crop.left ?? oldCrop.left) + (crop.right ?? oldCrop.right) >
            size.width
        )
          return;
      }
      if (crop.top && crop.bottom) {
        if (crop.top < 0) crop.bottom += crop.top;
        if (crop.bottom < 0) crop.top += crop.bottom;
      } else {
        // enforce minimum 1px cropbox height
        if (crop.top) {
          if (down.aspect) crop.top = Math.max(0, crop.top);
          crop.top = Math.min(
            crop.top,
            size.height - oldCrop.bottom - MIN_SIZE,
          );
        }
        if (crop.bottom) {
          if (down.aspect) crop.bottom = Math.max(0, crop.bottom);
          crop.bottom = Math.min(
            crop.bottom,
            size.height - oldCrop.top - MIN_SIZE,
          );
        }

        if (
          down.aspect &&
          (crop.top ?? oldCrop.top) + (crop.bottom ?? oldCrop.bottom) >
            size.height
        )
          return;
      }

      this.setCrop(crop);
      event.stopPropagation();
      event.preventDefault();
    }
  };

  private onPointerUp = (event: PointerEvent) => {
    const target = event.target as SVGElement;
    const down = this.pointers.get(event.pointerId);
    if (down && target.hasPointerCapture(event.pointerId)) {
      this.onPointerMove(event);
      target.releasePointerCapture(event.pointerId);
      event.stopPropagation();
      event.preventDefault();
      this.pointers.delete(event.pointerId);
    }
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      if (!this.state.pan) {
        this.setState({ pan: true });
      }
      event.preventDefault();
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    if (event.key === ' ') this.setState({ pan: false });
  };

  componentDidMount() {
    addEventListener('keydown', this.onKeyDown);
    addEventListener('keyup', this.onKeyUp);
  }

  componentWillUnmount() {
    removeEventListener('keydown', this.onKeyDown);
    removeEventListener('keyup', this.onKeyUp);
  }

  render({ size }: Props, { crop, pan }: State) {
    const x = crop.left;
    const y = crop.top;
    const width = size.width - crop.left - crop.right;
    const height = size.height - crop.top - crop.bottom;

    const s = (x: number) => x.toFixed(3);

    const clip = `polygon(0 0, 0 100%, 100% 100%, 100% 0, 0 0, ${s(x)}px ${s(
      y,
    )}px, ${s(x + width)}px ${s(y)}px, ${s(x + width)}px ${s(
      y + height,
    )}px, ${s(x)}px ${s(y + height)}px, ${s(x)}px ${s(y)}px)`;

    return (
      <svg
        ref={this.root}
        class={`${style.cropper} ${pan ? style.pan : ''}`}
        width={size.width + 20}
        height={size.height + 20}
        viewBox={`-10 -10 ${size.width + 20} ${size.height + 20}`}
        onPointerDown={this.onPointerDown}
        onPointerMove={this.onPointerMove}
        onPointerUp={this.onPointerUp}
      >
        <rect
          class={style.background}
          width={size.width}
          height={size.height}
          clip-path={clip}
        />
        <svg x={x} y={y} width={width} height={height}>
          <Freezer>
            <rect
              id="box"
              class={style.cropbox}
              data-edge="left,right,top,bottom"
              width="100%"
              height="100%"
            />

            <rect class={style.edge} data-edge="top" width="100%" />
            <rect class={style.edge} data-edge="bottom" width="100%" y="100%" />
            <rect class={style.edge} data-edge="left" height="100%" />
            <rect class={style.edge} data-edge="right" height="100%" x="100%" />

            <circle class={style.corner} data-edge="left,top" />
            <circle class={style.corner} data-edge="right,top" cx="100%" />
            <circle
              class={style.corner}
              data-edge="right,bottom"
              cx="100%"
              cy="100%"
            />
            <circle class={style.corner} data-edge="left,bottom" cy="100%" />
          </Freezer>
        </svg>
      </svg>
    );
  }
}

interface FreezerProps {
  children: ComponentChildren;
}
class Freezer extends Component<FreezerProps> {
  shouldComponentUpdate() {
    return false;
  }
  render({ children }: FreezerProps) {
    return children;
  }
}
