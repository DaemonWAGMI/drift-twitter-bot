const {
  node: nodeVersion,
} = process.versions;
const fs = require('fs');
const path = require('path');

if (!nodeVersion) {
  console.log('Unable to determine the current version of node');
  process.exit(1);
}

let pinnedNodeVersion;
try {
  const data = fs.readFileSync(path.resolve(__dirname, '../../.nvmrc'), 'utf8')
  pinnedNodeVersion = data.trim();
} catch (error) {
  console.error(error);
}

if (nodeVersion !== pinnedNodeVersion) {
  console.error(`Node version ${nodeVersion} does not match .nvmrc ${pinnedNodeVersion} - please run 'nvm use'`);
  process.exit(1);
}
