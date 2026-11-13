const { suiteConfig } = require('./wdio.base.conf');

exports.config = suiteConfig({
    specs: ['project-2/*.spec.js'],
});
