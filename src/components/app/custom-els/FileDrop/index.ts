import './styles.css';

/*
  <file-drop
    accepts='image/*'
    onFileDrop='javascript: (ev) => console.log(ev.detail);'
  >
   [everything in here is a drop target.]
  </file-drop>  
*/
export default class FileDrop extends HTMLElement {

  //
  private _accepts: string;

  constructor() {
    super();
    this._accepts = '';
  }

  connectedCallback() {
    this.addEventListener('dragstart', this.onDragStart);
    this.addEventListener('dragover', this.onDragOver);
    this.addEventListener('drop', this.onDrop);
    this.addEventListener('dragenter', () => true);
  }

  private convertMimeTypeToRegex(mimeType: string) {
    return mimeType.replace(/\*/, '[^/]+' );
  }

  private firstMatchingFile(list: FileList, accept: string) {
    let mimeRegex = this.convertMimeTypeToRegex(accept);
    let acceptsRegex = new RegExp(mimeRegex);
    acceptsRegex.compile();

    for(let i=0; i<list.length; i++) {
      let file = list[i];
      if(acceptsRegex.test(file.type)) {
        return file;
      }
    }
    return;
  }

  private onDragStart(e: DragEvent) {
    e.preventDefault();
    return true;
  }

  private onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  private onDrop(e: DragEvent) {
    e.preventDefault();
    let file = this.firstMatchingFile(e.dataTransfer.files, this._accepts);
   
    if(file !== undefined) {
      e.preventDefault();
      
      this.dispatchEvent(new CustomEvent("filedrop", { detail: file }));
    }
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