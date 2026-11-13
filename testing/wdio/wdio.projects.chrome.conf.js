const { suiteConfig } = require('./wdio.base.conf');

exports.config = suiteConfig({
    specs: ['project/*.spec.js'],
    exclude: ['project/layers.content.tree.dialog.spec.js'],
});
