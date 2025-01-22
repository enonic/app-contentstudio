/*global app, resolve*/

const widgetLib = require('/lib/export/widget');

const bean = __.newBean('com.enonic.xp.app.contentstudio.widget.MediaRenderingBean');

exports.get = function (req) {

    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return widgetLib.errorResponse(400);
    }

    if (!exports.canRender(req)) {
        // needed for the head request,
        // return 418 if not able to render
        log.debug(`Media [${req.method}] can't render: 418`);

        return widgetLib.errorResponse(418);
    }

    try {
        let response;

        if (bean.isImageContent(params.type)) {
            response = __.toNativeObject(bean.image(params.id, params.repository, params.branch, params.archive));
        } else {
            response = __.toNativeObject(bean.media(params.id, params.repository, params.branch, params.archive));
        }

        log.debug(
            `Media [${req.method}] response: ${response.status} - ${response.mimeType}\n${JSON.stringify(response.headers, null, 2)}`);

        return response;
    } catch (e) {
        log.error(`Media [${req.method}] error: ${e.message}`);
        return widgetLib.errorResponse(500);
    }
}

exports.canRender = function (req) {
    try {
        const params = widgetLib.validateParams(req.params);

        const canRender = __.toNativeObject(bean.canRender(params.id, params.repository, params.branch, params.archive));

        log.debug(`Media [CAN_RENDER]: ${canRender}`);

        return canRender;
    } catch (e) {
        log.error(`Media [CAN_RENDER] error: ${e.message}`);
        return false;
    }
}
