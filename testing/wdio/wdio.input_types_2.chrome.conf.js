const { suiteConfig } = require('./wdio.base.conf');

exports.config = suiteConfig({
    specs: ['content-types-2/*.spec.js'],
    exclude: [
        'content-types-2/folder.content.revert.permissions.spec.js',
        'content-types-2/revert.zoomed.image.spec.js',
    ],
    maxInstances: 2,
});
