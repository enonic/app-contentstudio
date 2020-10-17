const i18n = require('/lib/xp/i18n');
const admin = require('/lib/xp/admin');

const processRequest = function (req) {
    const customBundles = req.params && req.params.bundles ? req.params.bundles.split(',') : [];
    return {
        status: 200,
        contentType: 'application/json',
        body: getPhrases(customBundles)
    }
};

exports.get = processRequest;
exports.post = processRequest;

const getPhrases = function(customBundles) {
    const locales = admin.getLocales();
    let bundles = ['i18n/common', 'i18n/phrases'];
    if (customBundles.length) {
        bundles = bundles.concat(customBundles);
    }

    return i18n.getPhrases(locales, bundles);
};
