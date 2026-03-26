/*global app, resolve*/

const widgetLib = require('/lib/export/widget');

const bean = __.newBean('com.enonic.app.contentstudio.widget.MediaRenderingBean');

// MIME types that browsers can render inline without downloading
const BROWSER_RENDERABLE_TYPES = [
    'application/pdf',
    'application/json',
    'application/javascript',
    'application/ecmascript',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac', 'audio/flac', 'audio/mp4',
];

// MIME types that should not be previewed despite matching a renderable prefix
var BROWSER_NON_RENDERABLE_TYPES = [
    'text/csv',
];

function isBrowserRenderable(mimeType) {
    if (!mimeType) {
        return false;
    }

    if (BROWSER_NON_RENDERABLE_TYPES.indexOf(mimeType) >= 0) {
        return false;
    }

    if (mimeType.indexOf('image/') === 0) {
        return true;
    }

    if (mimeType.indexOf('text/') === 0) {
        return true;
    }

    return BROWSER_RENDERABLE_TYPES.indexOf(mimeType) >= 0;
}

exports.get = function (req) {

    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return widgetLib.widgetResponse(400);
    }

    if (!exports.canRender(req)) {
        // needed for the head request,
        // return 418 if not able to render
        log.debug(`Media [${req.method}] can't render: 418`);

        return widgetLib.widgetResponse(418);
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
        return widgetLib.widgetResponse(500);
    }
}

exports.canRender = function (req) {
    try {
        const params = widgetLib.validateParams(req.params);

        // don't show images preview in edit mode, because image editor is part of the form
        const canRender = __.toNativeObject(
            bean.canRender(params.id, params.repository, params.branch, params.archive, params.mode === 'edit'));

        if (!canRender) {
            log.debug('Media [CAN_RENDER]: false');
            return false;
        }

        // Images are always browser-renderable, skip MIME type check
        if (bean.isImageContent(params.type)) {
            log.debug('Media [CAN_RENDER]: true (image)');
            return true;
        }

        // For non-image media, verify the MIME type is browser-renderable
        const mimeType = __.toNativeObject(
            bean.resolveMimeType(params.id, params.repository, params.branch, params.archive));

        const renderable = isBrowserRenderable(mimeType);

        log.debug(`Media [CAN_RENDER]: ${renderable} (mimeType: ${mimeType})`);

        return renderable;
    } catch (e) {
        log.error(`Media [CAN_RENDER] error: ${e.message}`);
        return false;
    }
}
