const mustache = require('/lib/mustache');
const contextLib = require('/lib/xp/context');
const contentLib = require('/lib/xp/content');
const nodeLib = require('/lib/xp/node');
const adminLib = require('/lib/xp/admin');
const i18nLib = require('/lib/xp/i18n');
const projectLib = require('/lib/xp/project');
const staticLib = require('/lib/enonic/static');
const router = require('/lib/router')();
const issueFetcher = __.newBean('com.enonic.app.contentstudio.widget.issues.IssueFetcher');

const STATIC_BASE_PATH = '/_static';

exports.all = function (req) {
    return router.dispatch(req);
};

router.get('', (req) => {
    const view = resolve('./stats.html');
    const projects = getProjects();
    const contentItemsCount = '' + countItemsInRepos(projects);
    const languagesCount = '' + countLanguagesInRepos(projects);
    const openIssuesCount = '' + countIssuesInRepos(projects);
    const locales = req.locales;
    const handlerUrl = req.path;

    const params = {
        projectsCount: projects.length,
        contentItemsCount,
        languagesCount,
        openIssuesCount,
        stylesUrl: `${handlerUrl}/_static/styles/extensions/stats.css`,
        toolUrl: adminLib.getToolUrl(app.name, 'main'),
        contentItemsText: localise(locales, 'widget.dashboard.stats.contentItems'),
        openIssuesText: localise(locales, 'widget.dashboard.stats.openIssues'),
        projectsText: localise(locales, 'widget.dashboard.stats.projects'),
        languagesText: localise(locales, 'widget.dashboard.stats.languages'),
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params)
    };
});

router.get(`${STATIC_BASE_PATH}/{path:.*}`, (request) => {
    return staticLib.requestHandler(
        request,
        {
            cacheControl: () => staticLib.RESPONSE_CACHE_CONTROL.SAFE,
            index: false,
            root: '/assets',
            relativePath: staticLib.mappedRelativePath(STATIC_BASE_PATH),
        }
    );
});

function localise(locale, key) {
    return i18nLib.localize({
        bundles: ['i18n/phrases'],
        key,
        locale
    });
}

const countIssuesInRepos = function (projects) {
    let totalIssueCount = 0;
    projects.forEach((project) => {
        const issues = getIssuesInRepo(`com.enonic.cms.${project.id}`).getIssues();
        totalIssueCount += issues.length;
    });

    return totalIssueCount;
}

const getIssuesInRepo = (repositoryId, count, principalKey) => {
    return contextLib.run(
        {
            repository: repositoryId,
            branch: 'draft'
        },
        () => issueFetcher.list(count || -1, principalKey || null)
    );
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

const getProjects = () => {
    const projects = projectLib.list();
    const hideDefaultProjectAndSubprojects = app.config['settings.hideDefaultProject'] !== 'false';

    if (hideDefaultProjectAndSubprojects) {
        return projects.filter((p) => !isDefaultProjectOrSubproject(p, projects));
    }

    return projects;
}

const isDefaultProjectOrSubproject = (project, projects) => {
    if (!project) {
        return false;
    }

    return project.id === 'default' || isDefaultProjectOrSubproject(projects.filter((p) => p.id === project.parent)[0], projects);
}
