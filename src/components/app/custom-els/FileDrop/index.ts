import { bind } from '../../../../lib/util';
import './styles.css';

function firstMatchingItem(list: DataTransferItemList, acceptVal: string): DataTransferItem | undefined {
  // Split accepts values by ',' then by '/'. Trim everything & lowercase.
  const accepts = acceptVal.toLowerCase().split(',').map(accept => {
    return accept.trim().split('/').map(part => part.trim());
  }).filter(acceptParts => acceptParts.length === 2); // Filter invalid values

  return Array.from(list).find(item => {
    if (item.kind !== 'file') return false;

    // 'Parse' the type.
    const [typeMain, typeSub] = item.type.toLowerCase().split('/').map(s => s.trim());

    for (const [acceptMain, acceptSub] of accepts) {
      // Look for an exact match, or a partial match if * is accepted, eg image/*.
      if (typeMain === acceptMain && (acceptSub === '*' || typeSub === acceptSub)) {
        return true;
      }
    }
    return false;
  });
}

interface FileDropEventInit extends EventInit {
  file: File;
}

export class FileDropEvent extends Event {
  private _file: File;
  constructor(typeArg: string, eventInitDict: FileDropEventInit) {
    super(typeArg, eventInitDict);
    this._file = eventInitDict.file;
  }

  get file(): File {
    return this._file;
  }
}

/*
  Example Usage.
  <file-drop
    accept='image/*'
    class='drop-valid|drop-invalid'
  >
   [everything in here is a drop target.]
  </file-drop>

  dropElement.addEventListner('dropfile', (event) => console.log(event.detail))
*/
export class FileDrop extends HTMLElement {

  private _dragEnterCount = 0;

  constructor() {
    super();
    this.addEventListener('dragover', (event) => event.preventDefault());
    this.addEventListener('drop', this._onDrop);
    this.addEventListener('dragenter', this._onDragEnter);
    this.addEventListener('dragend', () => this._reset());
    this.addEventListener('dragleave', this._onDragLeave);
  }

  get accept() {
    return this.getAttribute('accept') || '';
  }

  set accept(val: string) {
    this.setAttribute('accept', val);
  }

  @bind
  private _onDragEnter(event: DragEvent) {
    this._dragEnterCount++;
    if (this._dragEnterCount > 1) return;

    // We don't have data, attempt to get it and if it matches, set the correct state.
    const dragDataItem = firstMatchingItem(event.dataTransfer.items, this.accept);
    if (dragDataItem) {
      this.classList.add('drop-valid');
    } else {
      this.classList.add('drop-invalid');
    }
  }

  @bind
  private _onDragLeave() {
    this._dragEnterCount--;
    if (this._dragEnterCount === 0) {
      this._reset();
    }
  }

  @bind
  private _onDrop(event: DragEvent) {
    event.preventDefault();
    this._reset();
    const dragDataItem = firstMatchingItem(event.dataTransfer.items, this.accept);
    if (!dragDataItem) return;

    const file = dragDataItem.getAsFile();
    if (file === null) return;

    this.dispatchEvent(new FileDropEvent('filedrop', { file }));
  }

  private _reset() {
    this._dragEnterCount = 0;
    this.classList.remove('drop-valid');
    this.classList.remove('drop-invalid');
  }
}

customElements.define('file-drop', FileDrop);
