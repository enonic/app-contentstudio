const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const packageData = require('../package.json');

const outDir = argv['out'];
const libPathInDotXp = 'file:../../../.xp/dev/lib-admin-ui';

function updateLibPath() {
    if (!outDir) {
        throw '--out=... argument is not defined';
    }

    const packageFile = path.join(outDir, 'package.json');

    packageData.dependencies['lib-admin-ui'] = libPathInDotXp;

    fs.writeFileSync(packageFile, JSON.stringify(packageData, null, '    '));
}

updateLibPath();
