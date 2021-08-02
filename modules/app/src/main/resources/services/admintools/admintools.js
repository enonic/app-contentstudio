var contentLib = require('/lib/xp/content');
var contextLib = require('/lib/xp/context');
var admin = require('/lib/xp/admin');

var adminToolsBean = __.newBean(
    'com.enonic.xp.app.contentstudio.GetAdminToolsScriptBean'
);

function getAdminTools() {
    var result = __.toNativeObject(adminToolsBean.execute());
    sortAdminTools(result);
    return processTools(result);
}

function sortAdminTools(tools) {
    return tools.sort(function(tool1, tool2) {
        if (tool1.name === 'settings') {
            return 1;
        }

        if (tool2.name === 'settings') {
            return -1;
        }

        return tool1.application > tool2.application ? 1 : -1;
    });
}

function processTools(adminTools) {
    var processedTools = [];

    for (var i = 0; i < adminTools.length; i++) {
        processedTools.push({
            key: adminTools[i].key,
            icon: adminTools[i].icon,
            uri: admin.getToolUrl(
                adminTools[i].application,
                adminTools[i].name
            ),
            displayName: adminTools[i].displayName
        });
    }

    return processedTools;
}

exports.get = function () {
    var adminTools = getAdminTools();

    return {
        status: 200,
        contentType: 'application/json',
        body: adminTools
    }
};

var doGetContent = function (contentId, versionId) {

    return contentLib.get({
        key: contentId,
        versionId: versionId
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
