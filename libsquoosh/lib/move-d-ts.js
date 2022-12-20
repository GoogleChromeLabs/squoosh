const fs = require('fs');
const path = require('path');

const tsOutputDir = path.resolve('..', '.tmp', 'ts', 'libsquoosh');
const tsOutputSourceDir = path.join(tsOutputDir, 'src');
const libSquooshTypesOutputDir = path.resolve('build', 'libsquoosh', 'types');

const codecsDir = path.resolve('..', 'codecs');
const codecsTypesOutputDir = path.resolve('build', 'codecs');

const buildDir = path.resolve('build');

async function getFilesRecursive(from) {
  const filesOrDirectories = await fs.promises.readdir(from, {
    withFileTypes: true,
  });

  const allFiles = await Promise.all(
    filesOrDirectories.map((fileOrDirectory) => {
      if (fileOrDirectory.isFile()) {
        return path.resolve(from, fileOrDirectory.name);
      } else if (
        fileOrDirectory.isDirectory() &&
        fileOrDirectory.name !== 'node_modules'
      ) {
        return getFilesRecursive(path.resolve(from, fileOrDirectory.name));
      }

      return [];
    }),
  );
  return allFiles.flat();
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

async function copyReferencedDeclarationFiles() {
  await Promise.all([
    fs.promises.copyFile(
      path.resolve('..', 'missing-types.d.ts'),
      path.resolve(buildDir, 'missing-types.d.ts'),
    ),
    fs.promises.copyFile(
      path.resolve('..', 'emscripten-types.d.ts'),
      path.resolve(buildDir, 'emscripten-types.d.ts'),
    ),
    fs.promises.copyFile(
      path.resolve('src', 'missing-types.d.ts'),
      path.resolve(buildDir, 'libsquoosh', 'types', 'missing-types.d.ts'),
    ),
    fs.promises.copyFile(
      path.resolve('src', 'WebAssembly.d.ts'),
      path.resolve(buildDir, 'libsquoosh', 'types', 'WebAssembly.d.ts'),
    ),
  ]);
}

// We need to import our needed ambient module declarations via triple slash directive
// However, at the place of import, ts compiler rewrites the path to be absolute and
// our import of "missing-types" in "index.d.ts" is not found
// meaning that some of the globally needed modules are not available: EmscriptenWasm, WebAssembly etc.
// This step here rewrites the absolute path to be a relative path
// so that our reference to "missing-types" work and the types are found
async function fixReferencePathOfMissingTypes() {
  const indexTypesPath = path.resolve(libSquooshTypesOutputDir, 'index.d.ts');
  const indexTypesContent = (
    await fs.promises.readFile(indexTypesPath)
  ).toString();
  const updatedIndexTypesContent = indexTypesContent.replace(
    'libsquoosh/src/',
    './',
  );
  await fs.promises.writeFile(indexTypesPath, updatedIndexTypesContent);
}

(async () => {
  await copyLibSquooshTypes();
  await copyCodecsTypes();
  await copyReferencedDeclarationFiles();
  await fixReferencePathOfMissingTypes();
})();
