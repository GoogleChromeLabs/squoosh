import { h, Component, RenderableProps } from 'preact';

interface Props {}
interface State {}

export default class SlideOnScroll extends Component<Props, State> {
  private observer?: IntersectionObserver;

  componentDidMount() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const base = this.base as HTMLElement;
    let wasOutOfView = false;

    this.observer = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            wasOutOfView = true;
            base.style.opacity = '0';
            return;
          }

          // Only transition in if the element was at some point out of view.
          if (wasOutOfView) {
            base.style.opacity = '';
            base.animate(
              { offset: 0, opacity: '0', transform: 'translateY(40px)' },
              { duration: 300, easing: 'ease' },
            );
          }
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );

    this.observer.observe(base);
  }

  componentWillUnmount() {
    // Have to manually disconnect due to memory leaks in browsers.
    // One day we'll be able to remove this, and the private property.
    // https://twitter.com/jaffathecake/status/1405437361643790337
    if (this.observer) this.observer.disconnect();
  }

  render({ children }: RenderableProps<Props>) {
    return <div>{children}</div>;
  }
}
