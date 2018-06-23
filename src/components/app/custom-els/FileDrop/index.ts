import './styles.css';

class DragState {

  private element: FileDrop;
  private hasDragData: boolean;

  constructor(element: FileDrop) {
    this.element = element;
    this.hasDragData = false;
  }

  bindEvents() {
    this.element.addEventListener('dragover', this.onDragOver.bind(this));
    this.element.addEventListener('drop', this.onDrop.bind(this));
    this.element.addEventListener('dragenter', this.onDragEnter.bind(this));
  }

  onDragEnter(e: DragEvent) {
    console.log(e)
    console.log(e.dataTransfer.items)
    this.hasDragData = this.hasMatchingFile(e.dataTransfer.items, this.element.accepts);
    return this.hasDragData;
  }

  onDragOver(e: DragEvent) {
    if(!!this.hasDragData) {
      e.preventDefault();
      return false;
    }
    return true;
  }

  onDrop(e: DragEvent) {
    console.log(e)
    if(this.hasDragData) {
      e.preventDefault();
      let dragData = this.firstMatchingFile(e.dataTransfer.files, this.element.accepts);
      
      this.element.dispatchEvent(new CustomEvent('filedrop', { detail: dragData }));
      this.hasDragData = false;
    }
  }

  private convertMimeTypeToRegex(mimeType: string): string {
    return mimeType.replace(/\*/, '[^/]+' ).replace(/\//g, '\\/');
  }

  private hasMatchingFile(list: DataTransferItemList, accept: string): boolean {
    let mimeRegex = this.convertMimeTypeToRegex(accept);
    let acceptsRegex = new RegExp(mimeRegex);

    for(let i=0; i<list.length; i++) {
      let item = list[i];
      console.log(item, acceptsRegex.test(item.type))
      if(item.kind === 'file' && acceptsRegex.test(item.type)) {
        return true;
      }
    }
    return false;
  }

  private firstMatchingFile(list: FileList, accept: string): File | undefined {
    let mimeRegex = this.convertMimeTypeToRegex(accept);
    let acceptsRegex = new RegExp(mimeRegex);

    for(let i=0; i<list.length; i++) {
      let file = list[i];
      if(acceptsRegex.test(file.type)) {
        return file;
      }
    }
    return;
  }
}

/*
  <file-drop
    accepts='image/*'
    onFileDrop='javascript: (ev) => console.log(ev.detail);'
  >
   [everything in here is a drop target.]
  </file-drop>  
*/
export default class FileDrop extends HTMLElement {

  private _accepts: string;
  private _dragState: DragState;

  constructor() {
    super();
    this._accepts = '';
    this._dragState = new DragState(this);
  }

  connectedCallback() {
    this._dragState.bindEvents();
  }

  get accepts () {
    return this._accepts;
  }

  set accepts (val: string) { 
    this._accepts = val;

    if (val) {
      this.setAttribute(this._accepts, '');
    } else {
      this.removeAttribute(this._accepts);
    }
  }
}

customElements.define('file-drop', FileDrop);