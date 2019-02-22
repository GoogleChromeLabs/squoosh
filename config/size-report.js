const path = require('path');
const { URL } = require('url');

const gzipSize = require('gzip-size');
const fetch = require('node-fetch');
const prettyBytes = require('pretty-bytes');
const escapeRE = require('escape-string-regexp');
const readdirp = require('readdirp');
const chalk = new require('chalk').constructor({ level: 4 });

function fetchTravis(path, options = {}) {
  const url = new URL(path, 'https://api.travis-ci.org');
  url.search = new URLSearchParams(options);

  return fetch(url, {
    headers: { 'Travis-API-Version': '3' },
  });
}

function fetchTravisBuildInfo(user, repo, branch) {
  return fetchTravis(`/repo/${encodeURIComponent(`${user}/${repo}`)}/builds`, {
    'branch.name': branch,
    state: 'passed',
    limit: 1,
    event_type: 'push',
  }).then(r => r.json());
}

function fetchTravisText(path) {
  return fetchTravis(path).then(r => r.text());
}

/**
 * Recursively-read a directory and turn it into an array of { name, size, gzipSize }
 */
async function dirToInfoArray(startPath) {
  const results = await new Promise((resolve, reject) => {
    readdirp({ root: startPath }, (err, results) => {
      if (err) reject(err); else resolve(results);
    });
  });

  return Promise.all(
    results.files.map(async (entry) => ({
      name: entry.path,
      gzipSize: await gzipSize.file(entry.fullPath),
      size: entry.stat.size,
    })),
  );
}

/**
 * Try to treat two entries with different file name hashes as the same file.
 */
function findHashedMatch(name, buildInfo) {
  const nameParts = /^(.+\.)[a-f0-9]+(\..+)$/.exec(name);
  if (!nameParts) return;

  const matchRe = new RegExp(`^${escapeRE(nameParts[1])}[a-f0-9]+${escapeRE(nameParts[2])}$`);
  const matchingEntry = buildInfo.find(entry => matchRe.test(entry.name));
  return matchingEntry;
}

const buildSizePrefix = '=== BUILD SIZES: ';
const buildSizePrefixRe = new RegExp(`^${escapeRE(buildSizePrefix)}(.+)$`, 'm');

async function getPreviousBuildInfo() {
  const buildData = await fetchTravisBuildInfo('GoogleChromeLabs', 'squoosh', 'master');
  const jobUrl = buildData.builds[0].jobs[0]['@href'];
  const log = await fetchTravisText(jobUrl + '/log.txt');
  const reResult = buildSizePrefixRe.exec(log);

  if (!reResult) return;
  return JSON.parse(reResult[1]);
}

/**
 * Generate an array that represents the difference between builds.
 * Returns an array of { beforeName, afterName, beforeSize, afterSize }.
 * Sizes are gzipped size.
 * Before/after properties are missing if resource isn't in the previous/new build.
 */
function getChanges(previousBuildInfo, buildInfo) {
  const buildChanges = [];
  const alsoInPreviousBuild = new Set();

  for (const oldEntry of previousBuildInfo) {
    const newEntry = buildInfo.find(entry => entry.name === oldEntry.name) ||
      findHashedMatch(oldEntry.name, buildInfo);

    // Entry is in previous build, but not the new build.
    if (!newEntry) {
      buildChanges.push({
        beforeName: oldEntry.name,
        beforeSize: oldEntry.gzipSize,
      });
      continue;
    }

    // Mark this entry so we know we've dealt with it.
    alsoInPreviousBuild.add(newEntry);

    // If they're the same, just ignore.
    // Using size rather than gzip size. I've seen different platforms produce different zipped
    // sizes.
    if (
      oldEntry.size === newEntry.size &&
      oldEntry.name === newEntry.name
    ) continue;

    // Entry is in both builds (maybe renamed).
    buildChanges.push({
      beforeName: oldEntry.name,
      afterName: newEntry.name,
      beforeSize: oldEntry.gzipSize,
      afterSize: newEntry.gzipSize,
    });
  }

  // Look for entries that are only in the new build.
  for (const newEntry of buildInfo) {
    if (alsoInPreviousBuild.has(newEntry)) continue;

    buildChanges.push({
      afterName: newEntry.name,
      afterSize: newEntry.gzipSize,
    });
  }

  return buildChanges;
}

async function main() {
  // Output the current build sizes for later retrieval.
  const buildInfo = await dirToInfoArray(__dirname + '/../build');
  console.log(buildSizePrefix + JSON.stringify(buildInfo));
  console.log('\nBuild change report:');

  let previousBuildInfo;

  try {
    previousBuildInfo = await getPreviousBuildInfo();
  } catch (err) {
    console.log(`  Couldn't parse previous build info`);
    return;
  }

  if (!previousBuildInfo) {
    console.log(`  Couldn't find previous build info`);
    return;
  }

  const buildChanges = getChanges(previousBuildInfo, buildInfo);

  if (buildChanges.length === 0) {
    console.log('  No changes');
    return;
  }

  // One letter references, so it's easier to get the spacing right.
  const y = chalk.yellow;
  const g = chalk.green;
  const r = chalk.red;

  for (const change of buildChanges) {
    // New file.
    if (!change.beforeSize) {
      console.log(`  ${g('ADDED')}   ${change.afterName} - ${prettyBytes(change.afterSize)}`);
      continue;
    }

    // Removed file.
    if (!change.afterSize) {
      console.log(`  ${r('REMOVED')} ${change.beforeName} - was ${prettyBytes(change.beforeSize)}`);
      continue;
    }

    // Changed file.
    let size;

    if (change.beforeSize === change.afterSize) {
      // Just renamed.
      size = `${prettyBytes(change.afterSize)} -> no change`;
    } else {
      const color = change.afterSize > change.beforeSize ? r : g;
      const sizeDiff = prettyBytes(change.afterSize - change.beforeSize, { signed: true });
      const relativeDiff = Math.round((change.afterSize / change.beforeSize) * 1000) / 1000;

      size = `${prettyBytes(change.beforeSize)} -> ${prettyBytes(change.afterSize)}` +
        ' (' +
        color(`${sizeDiff}, ${relativeDiff}x`) +
        ')';
    }

    console.log(`  ${y('CHANGED')} ${change.afterName} - ${size}`);

    if (change.beforeName !== change.afterName) {
      console.log(`    Renamed from: ${change.beforeName}`);
    }
  }
}

main();
