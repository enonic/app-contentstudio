const { suiteConfig } = require('./wdio.base.conf');

exports.config = suiteConfig({
    specs: ['page-editor/*.spec.js'],
    exclude: [
        'page-editor/portal.content.creating.spec.js',
        'page-editor/updated.text.in.preview.panel.liveview.spec.js',
    ],
    logLevel: 'trace',
});
