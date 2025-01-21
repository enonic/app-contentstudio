const contextLib = require('/lib/xp/context');
const portalLib = require('/lib/xp/portal');
const contentLib = require('/lib/xp/content');
const httpClient = require('/lib/http-client');
;

const WIDGET_HEADER_NAME = 'enonic-widget-data';

function validateParams(params) {
    const id = params.contentId;
    const path = params.contentPath;
    const type = params.type;
    const branch = params.branch || 'master';
    const repository = params.repo;
    const auto = params.auto || false;
    const mode = params.mode || 'preview';
    const archive = params.archive === 'true';

    const idOrPath = id || path;
    if (!idOrPath || !repository) {
        const text = `Missing required parameter: ${!idOrPath ? 'contentId or path' : 'repo'}`;
        log.error(text);
        throw new Error(text);
    }

    return {id, path, type, branch, repository, auto, mode, archive};
}

function errorResponse(status, messages) {
    const response = {
        status,
        contentType: 'application/json'
    }

    if (messages) {
        const messagesArray = Array.isArray(messages) ? messages : [messages];
        response.body = messagesArray.join(': ');
        if (!response.headers) {
            response.headers = {};
        }
        response.headers[WIDGET_HEADER_NAME] = JSON.stringify({messages: messagesArray});
    }

    return response;
}

function isArchiveContext(context) {
    return context.attributes && (context.attributes.contentRootPath === contentLib.ARCHIVE_ROOT_PATH);
}

function switchContext(repository, branch, archive, successCallback, errorCallback) {
    const context = contextLib.get();

    if (context.repository !== repository || context.branch !== branch || isArchiveContext(context) !== archive) {
        try {
            const newContext = {
                principals: ["role:system.admin"],
                repository,
                branch
            }

            if (!!archive) {
                newContext.attributes = {
                    contentRootPath: contentLib.ARCHIVE_ROOT_PATH
                }
            }

            return contextLib.run(newContext, function () {
                return successCallback();
            });
        } catch (e) {
            return errorCallback(e);
        }
    } else {
        return successCallback();
    }
}

function fetchContent(repository, branch, key, archive) {
    return switchContext(repository, branch, archive, function () {
        try {
            if (key) {
                return contentLib.get({key});
            } else {
                return portalLib.getContent();
            }
        } catch (e) {
            log.error(`Failed to fetch content: ${e.message}`);
            return null;
        }
    }, function (e) {
        log.error(`Failed to switch context: ${e.message}`);
        throw e;
    });
}


function fetchHttp(url, method, headers) {
    return httpClient.request({
        url,
        method,
        headers: {
            "Cookie": headers["Cookie"],
            "Cache-Control": "no-cache",
        },
        connectionTimeout: 1000,
        readTimeout: 5000,
    });
}

exports.errorResponse = errorResponse;
exports.validateParams = validateParams;
exports.switchContext = switchContext;
exports.fetchContent = fetchContent;
exports.fetchHttp = fetchHttp;
