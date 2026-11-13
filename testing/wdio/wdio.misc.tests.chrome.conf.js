const { suiteConfig } = require('./wdio.base.conf');

exports.config = suiteConfig({
    specs: ['misc/*.spec.js'],
    exclude: [
        'misc/image.properties.photo.location.spec.js',
        'misc/image.wizard.photo.properties.spec.js',
        'misc/revert.published.content.spec.js',
        'misc/update.path.spec.js',
    ],
});
