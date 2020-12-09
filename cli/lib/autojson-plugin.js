import { promises as fsp } from 'fs';

export default function autojsonPlugin() {
  return {
    name: 'autojson-plugin',
    async load(id) {
      if (id.endsWith('.json') && !id.startsWith('json:')) {
        return 'export default ' + await fsp.readFile(id, 'utf8');
      }
    }
  };
};
