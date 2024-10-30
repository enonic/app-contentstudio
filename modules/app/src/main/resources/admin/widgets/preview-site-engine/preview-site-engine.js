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
        body: `<iframe src="${url}"></iframe>`
    };
}

exports.canRender = function (req) {
    try {
        const params = widgetLib.validateParams(req.params);
        const url = createUrl(params);
        const response = widgetLib.fetchHttp(url, 'HEAD', req.headers);
        return !!response && response.status === 200;
    } catch (e) {
        return false;
    }
}

function createUrl(params) {
    const project = params.repository.substring('com.enonic.cms.'.length);
    return `http://localhost:8080/admin/site/inline/${project}/${params.branch}` + params.path;   //TODO: use real domain
}
