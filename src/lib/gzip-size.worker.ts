import { gzip } from 'pako/lib/deflate';

export default class GzipSizeWorker {
  gzipSize(data: string | ArrayBuffer) {
    return gzip(data).length;
  }
}
