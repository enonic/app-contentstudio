/*global app, resolve*/

const widgetLib = require('/lib/export/widget');
const adminLib = require('/lib/xp/admin');

const SHORTCUT_TYPE = 'base:shortcut';

exports.get = function (req) {
    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return widgetLib.errorResponse(400);
    }

    if (params.type === SHORTCUT_TYPE) {
        // return 418 if not able to render
        log.debug(`Site [${req.method}] can't render: 418`);

        return widgetLib.errorResponse(418);
    }

    try {
        const url = createUrl(req, params);

        log.debug(`Site [${req.method}] redirecting: ${url}`);

        return {
            redirect: url,
            contentType: 'text/html',
        }
    } catch (e) {
        log.error(`Site [${req.method}] error: ${e.message}`);
        return widgetLib.errorResponse(500);
    }
}

exports.canRender = function (req) {
    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return false;
    }

    if (params.type === SHORTCUT_TYPE) {
        return false;
    }

    try {
        const url = createUrl(req, params);
        const response = widgetLib.fetchHttp(url, 'HEAD', req.headers);

        // auto: 200
        // manual: !418
        const canRender = (params.auto && response.status === 200)
                          || (!params.auto && response.status !== 418);

        log.debug(`Site [CAN_RENDER]: ${canRender}`);

        return canRender;
    } catch (e) {
        log.error(`Site [CAN_RENDER] error: ${e.message}`);
        return false;
    }
}

function createUrl(req, params) {
    const project = params.repository.substring('com.enonic.cms.'.length);
    const baseUri = adminLib.getBaseUri();
    const normalizedBaseUri = baseUri === '/' ? '' : baseUri;
    return `${normalizedBaseUri}/site/${params.mode}/${project}/${params.branch}${params.path}`;
}
