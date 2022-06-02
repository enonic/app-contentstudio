const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const packageData = require('../package.json');

const outDir = argv['out'];
const libPathInDotXp = 'file:../lib-admin-ui';

function updateLibPath() {
    if (!outDir) {
        throw '--out=... argument is not defined';
    }

    const packageFile = path.join(outDir, 'package.json');

    packageData.dependencies['@enonic/lib-admin-ui'] = libPathInDotXp;
    const packageContent = JSON.stringify(packageData, null, '    ') + '\n';

    fs.writeFileSync(packageFile, packageContent);
}

updateLibPath();
