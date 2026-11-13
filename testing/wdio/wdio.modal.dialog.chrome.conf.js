const { suiteConfig } = require('./wdio.base.conf');

exports.config = suiteConfig({
    specs: ['modal-dialog/*.spec.js'],
});
