const { suiteConfig } = require('./wdio.base.conf');

exports.config = suiteConfig({
    specs: ['publish/*.spec.js', 'issue/*.spec.js'],
    exclude: [
        'publish/change.display.name.rename.published.content.spec.js',
        'publish/request.publish.dialog.validation.spec.js',
        'publish/request.publishing.dialog.mark.as.ready.spec.js',
        'publish/version.items.after.publishing.spec.js',
    ],
});
