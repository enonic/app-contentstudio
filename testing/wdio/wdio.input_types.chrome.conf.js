const { suiteConfig } = require('./wdio.base.conf');

exports.config = suiteConfig({
    specs: ['content-types/*.spec.js'],
});
