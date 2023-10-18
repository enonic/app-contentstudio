import type {LocalizeParams} from '/lib/xp/i18n';
import type {MultiRepoConnectParams} from '/lib/xp/node';
import type {Project} from '/lib/xp/project';
import type {Response} from '/types/';

// @ts-expect-error No types for /lib/mustache yet.
import {render} from '/lib/mustache';

import {getLocales, getToolUrl} from '/lib/xp/admin';
import {query} from '/lib/xp/content';
import {run} from '/lib/xp/context';
import {localize} from '/lib/xp/i18n';
import {multiRepoConnect} from '/lib/xp/node';
import {assetUrl} from '/lib/xp/portal';
import {getIssuesInRepo, getProjects} from '/helpers/dashboard-helper';


function localise(
    locale: LocalizeParams['locale'],
    key: LocalizeParams['key']
): string {
    return localize({
        bundles: ['i18n/phrases'],
        key,
        locale
    });
}

export function get(): Response {
    const view = resolve('./stats.html');
    const projects = getProjects();
    const contentItemsCount = '' + countItemsInRepos(projects);
    const languagesCount = '' + countLanguagesInRepos(projects);
    const openIssuesCount = '' + countIssuesInRepos(projects);
    const locales = getLocales();

    const params = {
        projectsCount: projects.length,
        contentItemsCount,
        languagesCount,
        openIssuesCount,
        stylesUrl: assetUrl({
            path: 'styles/widgets/stats.css'
        }),
        toolUrl: getToolUrl(app.name, 'main'),
        contentItemsText: localise(locales, 'widget.dashboard.stats.contentItems'),
        openIssuesText: localise(locales, 'widget.dashboard.stats.openIssues'),
        projectsText: localise(locales, 'widget.dashboard.stats.projects'),
        languagesText: localise(locales, 'widget.dashboard.stats.languages'),
    };

    return {
        contentType: 'text/html',
        body: render(view, params)
    };
}

const countIssuesInRepos = function (projects: Project[]) {
    let totalIssueCount = 0;
    projects.forEach((project) => {
        const issues = getIssuesInRepo(`com.enonic.cms.${project.id}`).getIssues();
        totalIssueCount += issues.length;
    });

    return totalIssueCount;
}

const countItemsInRepos = function (projects: Project[]) {
    let total = 0;

    projects.forEach(function (project) {
        total += countItemsInRepo('com.enonic.cms.' + project.id);
    });

    return total;
}

const getRepoSources = function (projects: Project[]): MultiRepoConnectParams['sources'] {
    return projects.map(function (project) {
        return {
            repoId: 'com.enonic.cms.' + project.id,
            branch: 'draft',
            principals: ["role:system.admin"]
        };
    });
}

const countLanguagesInRepos = function (projects: Project[]) {
    const repoSources = getRepoSources(projects);

    if (repoSources.length === 0) {
        return 0;
    }

    const repoConnection = multiRepoConnect({ sources: repoSources });

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

const countItemsInRepo = function (repositoryId: string) {
        return run(
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
    return query({
        start: 0,
        count: 0
    }).total;
}
