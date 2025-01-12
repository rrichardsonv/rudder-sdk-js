/* eslint-disable import/no-extraneous-dependencies */
import copy from 'rollup-plugin-copy';
import { getDefaultConfig } from './rollup.utilities';

const outDir = 'dist';
const distName = 'index';
const modName = 'rudderServiceWorker';
const npmPackageOutDir = `${outDir}/npm-lib/service-worker`;

const outputFiles = [
  {
    file: `${npmPackageOutDir}/index.js`,
    format: 'umd',
    name: modName,
  },
  {
    file: `${npmPackageOutDir}/index.es.js`,
    format: 'esm',
    name: modName,
  },
];

const buildConfig = {
  ...getDefaultConfig(distName),
};

buildConfig.plugins.push(
  copy({
    targets: [{ src: 'src/service-worker/index.d.ts', dest: `${outDir}/npm-lib/service-worker` }],
  })
);

export default {
  ...buildConfig,
  input: `src/service-worker/index.js`,
  output: outputFiles,
};
