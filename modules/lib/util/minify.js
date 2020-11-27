const Terser = require('terser');
const glob = require('glob');
const util = require('util');
const path = require('path');
const fs = require('fs');

const terserOptions = require('./terser.config');
const JS_GLOB = path.resolve('build/resources/main/dev/lib-contentstudio/**/*.js');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const find = util.promisify(glob);

async function minifyFile(file) {
    const data = await readFile(file, 'utf8');
    const result = Terser.minify(data, terserOptions);
    return Object.assign({file}, result);
}

async function saveFile(file, data) {
    return await writeFile(file, data);
}

(async function () {
    try {
        const files = await find(JS_GLOB);

        const promises = files.map(minifyFile);
        await Promise.all(promises).then(results => {
            results.forEach(result => {
                const {file, code} = result;
                const isValid = !!file && code != null;
                if (isValid) {
                    return saveFile(file, code);
                }
            });
        }).catch((e) => {
            console.error(e);
        });

        const count = files.length;
        const msg = count === 0 ? 'Nothing to minify.' : `${count} files were minified.`;
        console.log(msg);

    } catch (error) {
        console.error(error);
    }
})();
