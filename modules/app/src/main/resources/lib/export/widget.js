const contextLib = require('/lib/xp/context');
const portalLib = require('/lib/xp/portal');
const contentLib = require('/lib/xp/content');
const httpClient = require('/lib/http-client');
const i18nLib = require('/lib/xp/i18n');
const adminLib = require('/lib/xp/admin');

const WIDGET_HEADER_NAME = 'enonic-widget-data';

function validateParams(params) {
    const id = params.contentId;
    const path = params.contentPath;
    const type = params.type;
    const branch = params.branch || 'master';
    const repository = params.repo;
    const auto = params.auto === 'true';
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

function widgetResponse(status, data) {
    const response = {
        status,
        contentType: 'application/json'
    }

    if (data) {
        addData(response, data);
    }

    return response;
}

function redirectResponse(url, data) {
    const response = {
        redirect: url,
        contentType: 'text/html'
    }

    if (data) {
        addData(response, data);
    }

    return response;
}

function addData(response, data) {
    if (!response.body) {
        // there must be body to add headers
        response.body = '';
    }
    if (!response.headers) {
        response.headers = {};
    }
    response.headers[WIDGET_HEADER_NAME] = JSON.stringify(data);
}

function i18n(key) {
    const locales = adminLib.getLocales();
    return i18nLib.localize({
        key,
        bundles: ['i18n/phrases'],
        locale: locales
    });
}

function forceArray(value) {
    if (value === undefined || value === null) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
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

function fetchSite(repository, branch, key, archive) {
    return switchContext(repository, branch, archive, function () {
        try {
            if (key) {
                return contentLib.getSite({key});
            } else {
                return portalLib.getSite();
            }
        } catch (e) {
            log.error(`Failed to fetch site: ${e.message}`);
            return null;
        }
    }, function (e) {
        log.error(`Failed to switch context: ${e.message}`);
        throw e;
    });
}

function queryContent(contextParams, queryParams) {
    return switchContext(contextParams.repository, contextParams.branch, contextParams.archive, function () {
        return contentLib.query(queryParams);
    }, function (e) {
        log.error(`Failed to switch context: ${e.message}`);
        throw e;
    });
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

exports.redirectResponse = redirectResponse;
exports.widgetResponse = widgetResponse;
exports.validateParams = validateParams;
exports.switchContext = switchContext;
exports.fetchContent = fetchContent;
exports.queryContent = queryContent;
exports.fetchSite = fetchSite;
exports.fetchHttp = fetchHttp;
exports.forceArray = forceArray;
exports.i18n = i18n;
