/*global app, resolve*/

const widgetLib = require('/lib/export/widget');
const adminLib = require('/lib/xp/admin');
const appLib = require('/lib/xp/app');
const schemaLib = require('/lib/xp/schema');

const SHORTCUT_TYPE = 'base:shortcut';

exports.get = function (req) {
    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return widgetLib.errorResponse(400);
    }

    const isPage = hasPage(params);
    const hasControllers = hasAvailableControllers(params);
    const appsMissing = hasMissingApps(params);

    if (!isPage && hasControllers) {
        // Return hasControllers in non-auto mode
        return widgetLib.errorResponse(418, {
            hasControllers: !params.auto && hasControllers,
            hasPage: isPage,
        });
    }

    if (!hasControllers) {
        // Can't render
        return widgetLib.errorResponse(418, {
            messages: [widgetLib.i18n('text.addapplications')],
            hasControllers: hasControllers,
            hasPage: isPage,
        });
    }

    if (appsMissing) {
        return widgetLib.errorResponse(418, {
            messages: [widgetLib.i18n('field.preview.missing.description')],
            hasControllers: !params.auto && hasControllers,
            hasPage: isPage,
        });
    }

    if (!exports.canRender(req)) {
        // return 418 if not able to render
        log.debug(`Site [${req.method}] can't render: 418`);

        return widgetLib.errorResponse(418);
    }

    try {
        const url = createUrl(req, params);

        log.debug(`Site [${req.method}] redirecting: ${url}`);

        return widgetLib.redirectResponse(url, {
            hasControllers: hasControllers,
            hasPage: isPage,
        });
    } catch (e) {
        log.error(`Site [${req.method}] error: ${e.message}`);
        return widgetLib.errorResponse(500);
    }
}

exports.canRender = function (req) {
    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return false;
    }

    if (params.type === SHORTCUT_TYPE || params.archive) {
        return false;
    }

    return true;
}

function createUrl(req, params) {
    const project = params.repository.substring('com.enonic.cms.'.length);
    const baseUri = adminLib.getBaseUri();
    const normalizedBaseUri = baseUri === '/' ? '' : baseUri;
    return `${normalizedBaseUri}/site/${params.mode}/${project}/${params.branch}${params.path}`;
}

function hasAvailableControllers(params) {
    const appKeys = getSiteAppKeys(params);

    return appKeys.some((key) => {
        const appControllers = schemaLib.listComponents({
            type: 'PAGE',
            application: key,
        });
        //TODO: check app allowed content types

        return appControllers.length > 0;
    });
}

function hasPage(params) {
    const content = widgetLib.fetchContent(params.repository, params.branch, params.id || params.path, params.archive);

    return content && content.page && Object.keys(content.page).length > 0;
}

function hasMissingApps(params) {
    const appKeys = getSiteAppKeys(params)

    return appLib.list().some(app => app.started === false && appKeys.indexOf(app.key) >= 0);
}

function getSiteAppKeys(params) {
    const site = widgetLib.fetchSite(params.repository, params.branch, params.id || params.path, params.archive);

    const siteConfig = site && site.data && site.data.siteConfig;
    if (!siteConfig) {
        return [];
    }

    return widgetLib.forceArray(siteConfig).map(app => app.applicationKey);
}
