// @ts-expect-error No types for /lib/mustache yet.
import {render} from '/lib/mustache';
import {assetUrl, serviceUrl} from '/lib/xp/portal';

const VIEW = resolve('./settings.html');

export const get = () => ({
    contentType: 'text/html',
    body: render(VIEW, {
        assetsUri: assetUrl({path: 'js/settings.js'}),
        configServiceUrl: serviceUrl({service: 'config'})
    }),
});

