const mustache = require('/lib/mustache');
const contextLib = require('/lib/xp/context');
const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');
const helper = require('/helpers/dashboard-helper');

function handleGet() {
    const view = resolve('./content.html');
    const projects = helper.getProjects();
    const totalItems = '' + countItemsInRepos(projects);

    const params = {
        totalItems: totalItems,
        totalProjects: projects.length,
        stylesUri: portal.assetUrl({
            path: 'styles/widgets/content.css'
        }),
        jsUri: portal.assetUrl({
            path: 'js/widgets/content.js'
        }),
        chartDataServiceUrl: portal.serviceUrl({service: 'chartdata'})
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
}

const countItemsInRepos = function (projects) {
    let total = 0;

    projects.forEach(function (project) {
        total += countItemsInRepo('com.enonic.cms.' + project.id);
    });

    return total;
}

const countItemsInRepo = function (repositoryId) {
        return contextLib.run(
            {
                repository: repositoryId,
                branch: 'draft'
            },
            function () {
                return doCountItemsInRepo();
            }
        );
}

const doCountItemsInRepo = function () {
    return contentLib.query({
        start: 0,
        count: 0
    }).total;
}
exports.get = handleGet;
