const escapeRE = require("escape-string-regexp");

module.exports = {
  repo: "GoogleChromeLabs/squoosh",
  path: "build/**/!(*.map)",
  branch: "master",
  findRenamed(path, newPaths) {
    const nameParts = /^(.+\.)[a-f0-9]+(\..+)$/.exec(path);
    if (!nameParts) return;

    const matchRe = new RegExp(`^${escapeRE(nameParts[1])}[a-f0-9]+${escapeRE(nameParts[2])}$`);
    return newPaths.find(newPath => matchRe.test(newPath));
  }
};
