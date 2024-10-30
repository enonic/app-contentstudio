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

    const url = createUrl(params);

    return {
        status: 200,
        contentType: 'text/html',
        body: `<iframe class="media" src="${url}"></iframe>`
    }
}

exports.canRender = function (req) {
    try {
        const params = widgetLib.validateParams(req.params);
        const content = widgetLib.fetchContent(params.repository, params.branch, params.id);

        return !!content && content.type.startsWith('media:');
    } catch (e) {
        return false;
    }
}

function createUrl(params) {
    const project = params.repository.substring('com.enonic.cms.'.length);
    return `/admin/rest-v2/cs/cms/${project}/content/content/media/${params.id}?download=false`;
}
