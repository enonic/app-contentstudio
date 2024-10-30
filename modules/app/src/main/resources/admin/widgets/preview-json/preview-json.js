/*global app, resolve*/

const widgetLib = require('/lib/export/widget');

function handleGet(req) {

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

    try {
        const content = widgetLib.fetchContent(params.repository, params.branch, params.id || params.path);

        return {
            contentType: 'application/json',
            status: content ? 200 : 404,
            body: content
        };
    } catch (e) {
        return {
            status: 500,
            contentType: 'text/plain',
            body: 'Failed to render json: ' + e.message
        }
    }
}

exports.get = handleGet;

exports.canRender = function (req) {
    try {
        const params = widgetLib.validateParams(req.params);
        const content = widgetLib.fetchContent(params.repository, params.branch, params.id || params.path);

        return !!content;
    } catch (e) {
        return false;
    }
}
