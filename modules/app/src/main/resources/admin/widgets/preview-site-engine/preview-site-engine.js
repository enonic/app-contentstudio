/*global app, resolve*/

const portalLib = require('/lib/xp/portal');
const contentLib = require('/lib/xp/content');
const contextLib = require('/lib/export/context');

function handleGet(req) {
    const key = req.params.contentId;
    const branch = req.params.branch || 'master';
    const repository = req.params.repo;

    if (!key || !repository) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Missing required parameter: ' + (!key ? 'contentId' : 'repo')
        };
    }

    return contextLib.switchContext(repository, branch, function () {
        let content;
        if (key) {
            content = contentLib.get({key});
        } else {
            content = portalLib.getContent();
        }

        const project = repository.substring('com.enonic.cms.'.length);

        const url = `/admin/site/inline/${project}/${branch}` + content._path;

        return {
            contentType: 'text/html',
            status: 200,
            body: `<iframe src="${url}"></iframe>`
        };
    }, function (e) {
        log.error('Site engine preview failed to render content: ' + e.message);

        return {
            status: 500,
            contentType: 'text/plain',
            body: 'Failed to render content: ' + e.message
        }
    });
}

exports.get = handleGet;

exports.canRender = function (req) {
    const key = req.params.contentId;
    const repository = req.params.repo;

    return !!(key && repository);
}
