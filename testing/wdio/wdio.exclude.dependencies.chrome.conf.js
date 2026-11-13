const { suiteConfig } = require('./wdio.base.conf');

exports.config = suiteConfig({
    specs: ['exclude-dependencies/*.spec.js', 'misc2/*.spec.js', 'permissions/*.spec.js'],
    exclude: ['exclude-dependencies/publish.wizard.default.time.picker.popup.spec.js'],
});
