const { suiteConfig } = require('./wdio.base.conf');

exports.config = suiteConfig({
    specs: ['*.spec.js'],
    exclude: [
        'browse.selection.controller.spec.js',
        'outbound.dependency.rollback.version.spec.js',
        'site.app.uninstalled.spec.js',
        'site.configurator.htmlarea.spec.js',
    ],
});
