const mustache = require('/lib/mustache');
const contextLib = require('/lib/xp/context');
const contentLib = require('/lib/xp/content');
const portalLib = require('/lib/xp/portal');
const nodeLib = require('/lib/xp/node');
const helper = require('/helpers/dashboard-helper');

function handleGet() {
    const view = resolve('./stats.html');
    const projects = helper.getProjects();
    const totalItems = '' + countItemsInRepos(projects);
    const totalLanguages = '' + countLanguagesInRepos(projects);
    const openIssues = '' + countIssuesInRepos(projects);

    const params = {
        projects: projects.length,
        totalItems,
        totalLanguages,
        openIssues,
        stylesUri: portalLib.assetUrl({
            path: 'styles/widgets/stats.css'
        })
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
}

const countIssuesInRepos = function (projects) {
    let totalIssueCount = 0;
    projects.forEach((project) => {
        const issues = helper.getIssuesInRepo(`com.enonic.cms.${project.id}`).getIssues();
        totalIssueCount += issues.length;
    });

    return totalIssueCount;
}

const countItemsInRepos = function (projects) {
    let total = 0;

    projects.forEach(function (project) {
        total += countItemsInRepo('com.enonic.cms.' + project.id);
    });

    return total;
}

const getRepoSources = function (projects) {
    return projects.map(function (project) {
        return {
            repoId: 'com.enonic.cms.' + project.id,
            branch: 'draft',
            principals: ["role:system.admin"]
        };
    });
}

const countLanguagesInRepos = function (projects) {
    const repoSources = getRepoSources(projects);

    if (repoSources.length === 0) {
        return 0;
    }

    const repoConnection = nodeLib.multiRepoConnect({ sources: repoSources });

    const result = repoConnection.query({
        start: 0,
        count: 0,
        aggregations: {
            languageBuckets: {
                terms: {
                    field: 'language',
                    size: 100
                }
            }
        }
    });

    return result.aggregations.languageBuckets.buckets.length;
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
