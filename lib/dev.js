/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Runs the watching build and the static server side by side.
// DEV_PORT is shared by both, as the static build bakes it into the HTML.
process.env.DEV_PORT ||= '5000';

const procs = [
  ['bun', 'run', 'watch'],
  ['bun', 'run', 'serve', `--listen=${process.env.DEV_PORT}`],
].map((cmd) =>
  Bun.spawn(cmd, {
    env: process.env,
    stdio: ['inherit', 'inherit', 'inherit'],
  }),
);

const exitCode = await Promise.race(procs.map((proc) => proc.exited));
for (const proc of procs) proc.kill();
process.exit(exitCode);
