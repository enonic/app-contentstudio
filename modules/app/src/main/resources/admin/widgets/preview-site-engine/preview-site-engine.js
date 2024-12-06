/*global app, resolve*/

const widgetLib = require('/lib/export/widget');
const i18n = require('/lib/xp/i18n');

const SHORTCUT_TYPE = 'base:shortcut';

exports.get = function (req) {
    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return widgetLib.errorResponse(400, [i18n.localize({key: 'widget.liveview.badArguments'}), e.message]);
    }

    if (!exports.canRender(req)) {
        // needed for the head request,
        // return 418 if not able to render
        log.debug('Site [GET] can\'t render: 418');

        return widgetLib.errorResponse(418, [i18n.localize({key: 'widget.liveview.site.cantRender'})]);
    }

    try {
        const url = createUrl(req, params);

        log.debug(`Site [GET] redirecting: ${url}`);

        return {
            redirect: url,
            contentType: 'text/html',
        }
    } catch (e) {
        log.error(`Site [GET] error: ${e.message}`);
        return widgetLib.errorResponse(500, [i18n.localize({key: 'widget.liveview.site.error'}), e.message]);
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
    return `${req.scheme}://${req.host}:${req.port}/admin/site/inline/${project}/${params.branch}` + params.path;
}
