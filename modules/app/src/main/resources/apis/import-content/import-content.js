/*global resolve, __*/

const auth = require('/lib/xp/auth');
const i18n = require('/lib/xp/i18n');
const contextLib = require('/lib/xp/context');
const contentLib = require('/lib/xp/content');
const exportLib = require('/lib/xp/export');
const adminLib = require('/lib/xp/admin');

function jsonResponse(status, data) {
    return {
        status,
        contentType: 'application/json',
        headers: {
            'Cache-Control': 'no-store',
        },
        body: JSON.stringify(data || {})
    };
}

function runInContext(repository, fn) {
    if (!repository) {
        return fn();
    }
    return contextLib.run({repository, branch: 'draft', principals: ['role:system.admin']}, fn);
}

const ROOT_CONTENT_ID = 'root';

function resolveNodePath(contentId, repository) {
    if (!contentId || !repository) return '';
    if (contentId === ROOT_CONTENT_ID) return '/content';
    try {
        return runInContext(repository, function () {
            const content = contentLib.get({key: contentId});
            return content ? '/content' + content._path : '';
        });
    } catch (e) {
        log.error(`Import API could not resolve content ${contentId}: ${e.message}`);
        return '';
    }
}

function localize(key) {
    const values = Array.prototype.slice.call(arguments, 1);
    return i18n.localize({key, bundles: ['i18n/phrases'], values});
}

function safeName(value) {
    return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

const CMS_REPO_PREFIX = 'com.enonic.cms.';

function projectName(repository) {
    if (!repository) return '';
    return repository.indexOf(CMS_REPO_PREFIX) === 0 ? repository.substring(CMS_REPO_PREFIX.length) : repository;
}

function buildExportName(sourcePath, repository, customName) {
    const segments = sourcePath.split('/').filter(Boolean);
    const isRoot = sourcePath === '/content';
    const leaf = isRoot ? 'root' : (segments[segments.length - 1] || 'export');
    const name = safeName(customName || leaf);
    const project = safeName(projectName(repository));
    const stamp = new Date().toISOString().replace(/:/g, '-').replace(/\..*/, '');
    const installation = safeName(adminLib.getInstallation() || 'xp');
    return [installation, project, name, stamp].filter(Boolean).join('-');
}

function handleList(req) {
    try {
        const result = runInContext(req.params.repository, function () {
            return exportLib.list();
        });
        const exports = (result.exports || []).map(e => e.name);
        return jsonResponse(200, {exports});
    } catch (e) {
        log.error(`Import API list error: ${e.message}`);
        return jsonResponse(500, {message: 'Could not list exports'});
    }
}

function handleExport(req) {
    const contentId = req.params.contentId;
    const repository = req.params.repository;
    const customName = req.params.name;
    const sourcePath = resolveNodePath(contentId, repository);
    if (!sourcePath) {
        return jsonResponse(400, {message: localize('widget.import.status.error.export', 'Missing content or repository')});
    }
    try {
        const exportName = buildExportName(sourcePath, repository, customName);
        const result = runInContext(repository, function () {
            return exportLib.exportNodes({
                sourceNodePath: sourcePath,
                exportName
            });
        });
        result.exportName = exportName;
        return jsonResponse(200, result);
    } catch (e) {
        log.error(`Import API export error: ${e.message}`);
        return jsonResponse(500, {message: localize('widget.import.status.error.export', e.message)});
    }
}

function handleImport(req) {
    const exportName = req.params.exportName;
    const contentId = req.params.contentId;
    const repository = req.params.repository;
    const keepPublishFirst = req.params.keepPublishFirst !== 'false';
    const targetPath = resolveNodePath(contentId, repository);
    if (!exportName || !targetPath) {
        return jsonResponse(400, {message: localize('widget.import.status.error.import', 'Missing exportName or target content')});
    }
    try {
        const result = runInContext(repository, function () {
            return exportLib.importNodes({
                source: exportName,
                targetNodePath: targetPath,
                xslt: resolve('./import-content.xslt'),
                xsltParams: {keepPublishFirst: keepPublishFirst ? 'true' : 'false'},
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
        log.error(`Import API import error: ${e.message}`);
        return jsonResponse(500, {message: localize('widget.import.status.error.import', e.message)});
    }
}

exports.get = function (req) {
    if (req.params.action === 'list') {
        return handleList(req);
    }
    return jsonResponse(400, {message: 'Unknown action'});
};

exports.post = function (req) {
    if (req.params.action === 'export') {
        return handleExport(req);
    }
    if (req.params.action === 'import') {
        return handleImport(req);
    }
    return jsonResponse(400, {message: 'Unknown action'});
};
