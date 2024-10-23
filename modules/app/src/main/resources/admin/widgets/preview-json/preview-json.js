/*global app, resolve*/

const portalLib = require('/lib/xp/portal');
const contentLib = require('/lib/xp/content');
const contextLib = require('/lib/xp/context');

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

    log.debug('JSON preview: id=' + key + ', branch=' + branch + ', repo=' + repository);

    return renderInContext(repository, branch, key);
}

function renderInContext(repository, branch, key) {
    const context = contextLib.get();

    if (context.repository !== repository || context.branch !== branch) {
        try {
            const newContext = {
                principals: ["role:system.admin"],
                repository,
                branch
            }

            return contextLib.run(newContext, function () {
                return renderContent(key);
            });
        } catch (e) {
            log.error('JSON preview failed to render content: ' + e.message);
            return {
                status: 500,
                contentType: 'text/plain',
                body: 'Failed to render content: ' + e.message
            }
        }
    } else {
        return renderContent(key);
    }
}

function renderContent(key) {
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
}

exports.get = handleGet;

exports.canRender = function () {
    return true;
}
