import type {Request, Response} from '/types/';

import {getLocales} from '/lib/xp/admin';
import {getPhrases as _getPhrases} from '/lib/xp/i18n';

export function get(req: Request): Response {
    const customBundles = req.params && req.params.bundles ? req.params.bundles.split(',') : [];
    return {
        status: 200,
        contentType: 'application/json',
        body: getPhrases(customBundles)
    }
};

export const post = get;

const getPhrases = function(customBundles) {
    const locales = getLocales();
    const phrases = {};
    let bundles = ['i18n/common', 'i18n/phrases', 'i18n/dialogs'];
    if (customBundles.length) {
        bundles = bundles.concat(customBundles);
    }

    bundles.forEach(function (bundle) {
        const bundlePhrases = _getPhrases(locales, [bundle]);
        for (const key in bundlePhrases) {
            if (bundlePhrases.hasOwnProperty(key)) {
                // This should be ok with the hasOwnProperty check above
                /* eslint-disable-next-line */
                phrases[key] = bundlePhrases[key];
            }
        }
    });

    return phrases;
};
