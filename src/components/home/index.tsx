import { h, Component } from 'preact';
// import Button from 'preact-material-components/Button';
// import Switch from 'preact-material-components/Switch';
// import 'preact-material-components/Switch/style.css';
import * as style from './style.scss';
import { FileObj } from '../app';

type Props = {
  files: FileObj[]
};

type State = {
  active: boolean
};

export default class Home extends Component<Props, State> {
  state: State = {
    active: false
  };

  componentDidMount() {
    setTimeout(() => {
      this.setState({ active: true });
    });
  }

  render({ files }: Props, { active }: State) {
    return (
      <div class={style.home}>
        { files && files[0] && (
          <img src={files[0].uri} class={style.image} />
        ) || (
          <div class={style.content}>
            <h1>Squoosh</h1>
            <p>Test home content</p>
          </div>
        ) }
      </div>
    );
  }
}
