import { promises as fsp } from "fs";

const prefix = "json:";

const reservedKeys = ["public"];

export default function jsonPlugin() {
  return {
    name: "json-plugin",
    async resolveId(id, importer) {
      if (!id.startsWith(prefix)) return;
      const realId = id.slice(prefix.length);
      const resolveResult = await this.resolve(realId, importer);

      if (!resolveResult) {
        throw Error(`Cannot find ${realId}`);
      }
      // Add an additional .js to the end so it ends up with .js at the end in the _virtual folder.
      return prefix + resolveResult.id;
    },
    async load(id) {
      if (!id.startsWith(prefix)) return;
      const realId = id.slice(prefix.length);
      const source = await fsp.readFile(realId, "utf8");

      let code = "";
      for (const [key, value] of Object.entries(JSON.parse(source))) {
        if (reservedKeys.includes(key)) {
          continue;
        }
        code += `
				export const ${key} = ${JSON.stringify(value)};
			`;
      }
      return code;
    }
  };
}
