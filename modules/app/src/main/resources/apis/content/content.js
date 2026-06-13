/*global resolve*/

var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');
var portalLib = require('/lib/xp/portal');

exports.get = function (req) {
    // Fetch-only API: lock down so a direct browser navigation to this endpoint is inert.
    portalLib.csp().strict();
    var contentId = req.params.contentId;

    if (!contentId) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Missing required parameter: contentId'
        };
    }

    return {
        status: 200,
        contentType: 'application/json',
        headers: {
            'Cache-Control': 'no-store',
        },
        body: getContent(contentId, req.params.versionId, req.params.repositoryId)
    };
};

var doGetContent = function (contentId, versionId) {
    return contentLib.get({
        key: contentId,
        versionId
    });
}

var getContent = function (contentId, versionId, repositoryId) {
    if (!repositoryId) {
        return doGetContent(contentId,versionId);
    }

    return contextLib.run(
        {
            repository: repositoryId,
            branch: 'draft'
        },
        function() {
            return doGetContent(contentId, versionId);
        }
    );
};

