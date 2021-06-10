
import {dirname} from "path";
globalThis.__dirname = dirname(import.meta.url);
import { createRequire } from 'module';

globalThis.require = createRequire(import.meta.url);
import visdif from './visdif.js';

const {VisDiff} = await visdif({
	locateFile() {
		return new URL("./visdif.wasm", import.meta.url).pathname;
	}
});

const comparator = new VisDiff(
	new Uint8ClampedArray([0, 0, 0, 255]),
	1,	
	1
);

const distance = comparator.distance(new Uint8ClampedArray([1,1,1,255]));
console.log({distance});