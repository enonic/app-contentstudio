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

        return {
            contentType: 'application/json',
            status: content ? 200 : 404,
            body: content
        };
    }, function (e) {
        log.error('JSON preview failed to render content: ' + e.message);

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
