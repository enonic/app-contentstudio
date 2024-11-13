/*global app, resolve*/

const widgetLib = require('/lib/export/widget');

exports.get = function (req) {
    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: e.message
        };
    }

    if (!exports.canRender(req)) {
        // needed for the head request,
        // return 418 if not able to render
        log.info('Site [GET] can\'t render: ' + 418);

        return {
            status: 418,
            contentType: 'text/plain',
            body: 'Cannot render site'
        }
    }

    try {
        const url = createUrl(req, params);

        log.info('Site [GET] redirecting: ' + url);

        return {
            redirect: url,
            contentType: 'text/html',
        }
    } catch (e) {
        return {
            status: 500,
            contentType: 'text/plain',
            body: 'Failed to render site: ' + e.message
        }
    }
}

exports.canRender = function (req) {
    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return false;
    }

    try {
        const url = createUrl(req, params);
        const response = widgetLib.fetchHttp(url, 'HEAD', req.headers);

        // auto: 200
        // manual: !418
        const canRender = (params.auto && response.status === 200)
                          || (!params.auto && response.status !== 418);

        log.info('Site [CAN_RENDER]: ' + canRender);

        return canRender;
    } catch (e) {
        log.error('Site widget canRender failed: ' + e.message);
        return false;
    }
}

function createUrl(req, params) {
    const project = params.repository.substring('com.enonic.cms.'.length);
    return `${req.scheme}://${req.host}:${req.port}/admin/site/inline/${project}/${params.branch}` + params.path;
}
