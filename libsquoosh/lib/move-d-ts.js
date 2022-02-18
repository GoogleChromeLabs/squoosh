const fs = require('fs');
const del = require('del');
const path = require('path');

const tsOutputDir = path.resolve('..', '.tmp', 'ts', 'libsquoosh');
const tsOutputSourceDir = path.join(tsOutputDir, 'src');
const libSquooshTypesOutputDir = path.resolve('build', 'libsquoosh', 'types');

const codecsDir = path.resolve('..', 'codecs');
const codecsTypesOutputDir = path.resolve('build', 'codecs');

async function getFilesRecursive(from) {
  const filesOrDirectories = await fs.promises.readdir(from, {
    withFileTypes: true,
  });

  const allFiles = await Promise.all(
    filesOrDirectories.flatMap((fileOrDirectory) => {
      if (fileOrDirectory.isFile()) {
        return path.resolve(from, fileOrDirectory.name);
      }

      return getFilesRecursive(path.resolve(from, fileOrDirectory.name));
    }),
  );
  return allFiles.flatMap((x) => x);
}

async function copyTypes(from, to) {
  const files = await getFilesRecursive(from);
  for (const file of files) {
    if (file.endsWith('d.ts') || file.endsWith('d.ts.map')) {
      const currentPath = path.resolve(from, file);
      const finalPath = path.resolve(to, path.relative(from, file));
      await fs.promises.mkdir(path.resolve(finalPath, '..'), {
        recursive: true,
      });
      await fs.promises.copyFile(currentPath, finalPath);
    }
  }
}

async function copyLibSquooshTypes() {
  await copyTypes(tsOutputSourceDir, libSquooshTypesOutputDir);
}

async function copyCodecsTypes() {
  await copyTypes(codecsDir, codecsTypesOutputDir);
}

(async () => {
  await copyLibSquooshTypes();
  await copyCodecsTypes();
})();
