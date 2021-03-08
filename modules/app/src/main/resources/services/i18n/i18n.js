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
    const phrases = {};
    let bundles = ['i18n/common', 'i18n/phrases', 'i18n/dialogs'];
    if (customBundles.length) {
        bundles = bundles.concat(customBundles);
    }

    for (const bundleIndex in bundles) {
        const bundlePhrases = i18n.getPhrases(locales, [bundles[bundleIndex]]);
        for (const key in bundlePhrases) { phrases[key] = bundlePhrases[key] }
    }

    return phrases;
};
