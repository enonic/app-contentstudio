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
        log.info('Media [GET] can\'t render: ' + 418);

        return {
            status: 418,
            contentType: 'text/plain',
            body: 'Cannot render media'
        }
    }

    try {
        const url = createUrl(params);

        log.info('Media [GET]: ' + url);

        return {
            redirect: url,
        }
    } catch (e) {
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
        const content = widgetLib.fetchContent(params.repository, params.branch, params.id || params.path);
        const canRender = !!content && content.type.startsWith('media:');

        log.info('Media [CAN_RENDER]: ' + canRender);

        return canRender;
    } catch (e) {
        return false;
    }
}

function createUrl(params) {
    const project = params.repository.substring('com.enonic.cms.'.length);
    return `/admin/rest-v2/cs/cms/${project}/content/content/media/${params.id}?download=false`;
}
