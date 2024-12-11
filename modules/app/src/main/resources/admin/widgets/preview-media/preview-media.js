/*global app, resolve*/

const widgetLib = require('/lib/export/widget');

const bean = __.newBean('com.enonic.xp.app.contentstudio.widget.MediaRenderingBean');

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
        log.info('Media [GET] can\'t render: ' + 418);

        return {
            status: 418,
            contentType: 'text/plain',
            body: 'Cannot render media'
        }
    }

    try {
        log.info('Media [GET]: ' + params.id + ', type: ' + params.type);
        let response;

        if (bean.isImageContent(params.type)) {
            response = __.toNativeObject(bean.image(params.id, params.repository, params.branch));
        } else {
            response = __.toNativeObject(bean.media(params.id, params.repository, params.branch));
        }

        log.info('Media [GET] response: ' + response.status + ', ' + response.mimeType + '\n' + JSON.stringify(response.headers, null, 2));

        return response;
    } catch (e) {
        log.error('Media [GET] error: ' + e.message);
        return {
            status: 500,
            contentType: 'text/plain',
            body: 'Failed to render media: ' + e.message
        }
    }
}

exports.canRender = function (req) {
    try {
        const params = widgetLib.validateParams(req.params);

        const canRender = __.toNativeObject(bean.canRender(params.repository, params.branch, params.id));

        log.info('Media [CAN_RENDER]: ' + canRender);

        return canRender;
    } catch (e) {
        log.error(`Media [CAN_RENDER] error: ${e.message}`);
        return false;
    }
}
