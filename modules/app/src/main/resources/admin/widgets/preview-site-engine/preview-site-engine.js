/*global app, resolve*/

const widgetLib = require('/lib/export/widget');
const adminLib = require('/lib/xp/admin');
const appLib = require('/lib/xp/app');
const schemaLib = require('/lib/xp/schema');

const SHORTCUT_TYPE = 'base:shortcut';
const TEMPLATE_TYPE = 'portal:page-template';

exports.get = function (req) {
    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return widgetLib.widgetResponse(400);
    }

    if (!exports.canRender(req)) {
        // return 418 if not able to render
        log.debug(`Site [${req.method}] can't render: 418`);

        return widgetLib.widgetResponse(418);
    }

    try {
        const url = createUrl(req, params);

        log.debug(`Site [${req.method}] redirecting: ${url}`);

        const data = collectResponseData(req, params, url)
        // don't use 30x redirect here because we want client to be able to read our headers first
        // client will handle redirect manually based on the data

        log.debug(`Site [${req.method}] response: ${JSON.stringify(data)}`);

        if (params.mode === 'inline' || params.mode === 'edit') {
            // we handle that on the client in inline and edit modes
            return widgetLib.widgetResponse(200, data);
        }

        // in other modes we leave it to browser to handle the redirect
        return widgetLib.redirectResponse(url, data);

    } catch (e) {
        log.error(`Site [${req.method}] error: ${e.message}`);
        return widgetLib.widgetResponse(500);
    }
}

exports.canRender = function (req) {
    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return false;
    }

    return params.type !== SHORTCUT_TYPE && !params.archive;
}

function createUrl(req, params) {
    const project = params.repository.substring('com.enonic.cms.'.length);
    const baseUri = adminLib.getHomeToolUrl();
    const normalizedBaseUri = baseUri === '/' ? '' : baseUri;
    return `${normalizedBaseUri}/site/${params.mode}/${project}/${params.branch}${params.path}`;
}

function collectResponseData(req, params, url) {
    const site = widgetLib.fetchSite(params.repository, params.branch, params.id || params.path, params.archive);
    const isPageOrFragment = hasPageOrFragment(params);
    const appKeys = getSiteAppKeys(site, params);
    const messages = [];
    const i18n = widgetLib.i18nFn(req);

    if (hasMissingApps(appKeys)) {
        messages.push(i18n('field.preview.missing.description'));
    }

    const hasControllers = hasAvailableControllers(params, appKeys);
    if (!hasControllers) {
        messages.push(i18n('text.addapplications'));
    }

    return {
        messages: messages.length ? messages : undefined,
        hasControllers,
        hasPage: isPageOrFragment,
        redirect: url
    }
}

function hasAvailableControllers(params, appKeys) {
    return widgetLib.switchContext(params.repository, params.branch, params.archive, function () {
        return appKeys.some((key) => {
            const appControllers = schemaLib.listComponents({
                type: 'PAGE',
                application: key
            });
            //TODO: check app allowed content types

            return appControllers.length > 0;
        });
    }, function (e) {
        log.error(`Failed to switch context: ${e.message}`);
        throw e;
    });
}

function hasPageOrFragment(params) {
    const content = widgetLib.fetchContent(params.repository, params.branch, params.id || params.path, params.archive);

    if (!content) {
        return false;
    }
    const pageOrFragment = content.page || content.fragment;

    return pageOrFragment && Object.keys(pageOrFragment).length > 0;
}

function hasMissingApps(appKeys) {

    return appLib.list().some(app => app.started === false && appKeys.indexOf(app.key) >= 0);
}

function getSiteAppKeys(site) {
    const siteConfig = site && site.data && site.data.siteConfig;
    if (!siteConfig) {
        return [];
    }

    return widgetLib.forceArray(siteConfig).map(app => app.applicationKey);
}
