/*global app, resolve*/

const widgetLib = require('/lib/export/widget');
const i18n = require('/lib/xp/i18n');

const bean = __.newBean('com.enonic.xp.app.contentstudio.widget.MediaRenderingBean');

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
        log.debug('Media [GET] can\'t render: 418');

        return widgetLib.errorResponse(418, [i18n.localize({key: 'widget.liveview.media.cantRender'})]);
    }

    try {
        let response;

        if (bean.isImageContent(params.type)) {
            response = __.toNativeObject(bean.image(params.id, params.repository, params.branch));
        } else {
            response = __.toNativeObject(bean.media(params.id, params.repository, params.branch));
        }

        log.debug(`Media [GET] response: ${response.status} - ${response.mimeType}\n${JSON.stringify(response.headers, null, 2)}`);

        return response;
    } catch (e) {
        log.error(`Media [GET] error: ${e.message}`);
        return widgetLib.errorResponse(500, [i18n.localize({key: 'widget.liveview.media.error'}), e.message]);
    }
}

exports.canRender = function (req) {
    try {
        const params = widgetLib.validateParams(req.params);

        const canRender = __.toNativeObject(bean.canRender(params.repository, params.branch, params.id));

        log.debug(`Media [CAN_RENDER]: ${canRender}`);

        return canRender;
    } catch (e) {
        log.error(`Media [CAN_RENDER] error: ${e.message}`);
        return false;
    }
}
