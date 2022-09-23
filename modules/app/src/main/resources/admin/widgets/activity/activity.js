const mustache = require('/lib/mustache');
const portal = require('/lib/xp/portal');

function handleGet() {
    const view = resolve('./activity.html');

    const params = {
        stylesUri: portal.assetUrl({
            path: 'styles/widgets/activity.css'
        }),
        jsUri: portal.assetUrl({
            path: 'js/widgets/activity.js'
        }),
        chartDataServiceUrl: portal.serviceUrl({service: 'chartdata'})
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
}

exports.get = handleGet;
