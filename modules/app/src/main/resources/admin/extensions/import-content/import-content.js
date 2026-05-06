/*global app, resolve, __*/

const portal = require('/lib/xp/portal');
const auth = require('/lib/xp/auth');
const i18n = require('/lib/xp/i18n');
const contextLib = require('/lib/xp/context');
const contentLib = require('/lib/xp/content');
const exportLib = require('/lib/xp/export');
const adminLib = require('/lib/xp/admin');
const mustache = require('/lib/mustache');
const router = require('/lib/router')();

function resolveNodePath(req) {
    const contentId = req.params.contentId;
    const repository = req.params.repository;
    if (!contentId || !repository) return '';
    try {
        return contextLib.run({repository: repository, branch: 'draft', principals: ['role:system.admin']}, function () {
            const content = contentLib.get({key: contentId});
            return content ? '/content' + content._path : '';
        });
    } catch (e) {
        log.error(`Import widget could not resolve content ${contentId}: ${e.message}`);
        return '';
    }
}

function runInContext(req, fn) {
    const repository = req.params.repository;
    if (!repository) {
        return fn();
    }
    return contextLib.run({repository: repository, branch: 'draft', principals: ['role:system.admin']}, fn);
}

function jsonResponse(status, data) {
    return {
        status,
        contentType: 'application/json',
        body: JSON.stringify(data || {})
    };
}

function ensureAdmin() {
    if (!auth.hasRole('system.admin')) {
        return jsonResponse(403, {message: 'Admin role required'});
    }
    return null;
}

function localize(key) {
    const args = Array.prototype.slice.call(arguments, 1);
    return i18n.localize({key: key, bundles: ['i18n/phrases'], values: args});
}

function readField(req, name) {
    if (portal.getMultipartForm()) {
        return portal.getMultipartText(name);
    }
    return req.params[name];
}

function safeName(value) {
    return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function buildExportName(sourcePath) {
    const segments = sourcePath.split('/').filter(Boolean);
    const leaf = segments[segments.length - 1] || 'export';
    const stamp = new Date().toISOString().replace(/:/g, '-').replace(/\..*/, '');
    const installation = safeName(adminLib.getInstallation() || 'xp');
    return installation + '-' + leaf + '-draft-' + stamp;
}

router.get('', function (req) {
    const denied = ensureAdmin();
    if (denied) return denied;

    const view = resolve('./import-content.html');
    const targetPath = resolveNodePath(req);
    const widgetParams = {
        contentId: req.params.contentId || '',
        repository: req.params.repository || ''
    };
    const params = {
        targetPath,
        targetPathJson: JSON.stringify(targetPath),
        handlerUrlJson: JSON.stringify(req.path),
        widgetParamsJson: JSON.stringify(widgetParams),
        text: {
            heading: localize('widget.import.list.heading'),
            empty: localize('widget.import.list.empty'),
            refresh: localize('widget.import.list.refresh'),
            exportButton: localize('widget.import.export.button'),
            importButton: localize('widget.import.button')
        }
    };
    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
});

router.get('/list', function (req) {
    const denied = ensureAdmin();
    if (denied) return denied;

    try {
        const result = runInContext(req, function () {
            return exportLib.list();
        });
        const exports = (result.exports || []).map(function (e) { return e.name; });
        return jsonResponse(200, {exports});
    } catch (e) {
        log.error(`Import widget list error: ${e.message}`);
        return jsonResponse(500, {message: 'Could not list exports'});
    }
});

router.post('/import', function (req) {
    const denied = ensureAdmin();
    if (denied) return denied;

    const exportName = readField(req, 'exportName');
    const targetPath = readField(req, 'targetPath');
    if (!exportName || !targetPath) {
        return jsonResponse(400, {message: localize('widget.import.status.error.import', 'Missing exportName or targetPath')});
    }
    try {
        const result = runInContext(req, function () {
            return exportLib.importNodes({
                source: exportName,
                targetNodePath: targetPath,
                xslt: resolve('./import-content.xslt'),
                versionAttributes: {
                    'content.import': {
                        user: auth.getUser().key,
                        optime: new Date().toISOString()
                    },
                    'vacuum.skip': {}
                }
            });
        });
        return jsonResponse(200, result);
    } catch (e) {
        log.error(`Import widget import error: ${e.message}`);
        return jsonResponse(500, {message: localize('widget.import.status.error.import', e.message)});
    }
});

router.post('/export', function (req) {
    const denied = ensureAdmin();
    if (denied) return denied;

    const sourcePath = readField(req, 'sourcePath');
    if (!sourcePath) {
        return jsonResponse(400, {message: localize('widget.import.status.error.export', 'Missing sourcePath')});
    }
    try {
        const exportName = buildExportName(sourcePath);
        const result = runInContext(req, function () {
            return exportLib.exportNodes({
                sourceNodePath: sourcePath,
                exportName: exportName
            });
        });
        result.exportName = exportName;
        return jsonResponse(200, result);
    } catch (e) {
        log.error(`Import widget export error: ${e.message}`);
        return jsonResponse(500, {message: localize('widget.import.status.error.export', e.message)});
    }
});

exports.all = function (req) {
    return router.dispatch(req);
};
