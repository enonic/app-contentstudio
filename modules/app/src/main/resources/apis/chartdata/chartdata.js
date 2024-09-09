const contextLib = require('/lib/xp/context');
const contentLib = require('/lib/xp/content');
const helper = require('/helpers/dashboard-helper');

const daysAgo = 30;

const getDateXDaysAgo = (days) => {
    const dateOffset = (24 * 60 * 60 * 1000) * days;
    const dateXDaysAgo = new Date();
    dateXDaysAgo.setTime(dateXDaysAgo.getTime() - dateOffset);
    return dateXDaysAgo;
}

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const twoDigitMonth = month > 9 ? month : ('0' + month);
    const day = date.getDate();
    const twoDigitDay = day > 9 ? day : ('0' + day);
    return `${year}-${twoDigitMonth}-${twoDigitDay}`;
}

const getFormattedDateXDaysAgo = (days) => {
    const dateXDaysAgo = getDateXDaysAgo(days);
    const formatted = formatDate(dateXDaysAgo);

    return formatted;
}

const dateFilterValue = getFormattedDateXDaysAgo(daysAgo);

const handleGet = () => {
    const projects = helper.getProjects();
    const activityMap = getStatsFromAllRepos(projects);

    return {
        contentType: 'application/json',
        body: activityMap
    };
}

const getStatsFromAllRepos = (projects) => {
    const activityMap = generateActivityMap();

    projects.forEach(function (project) {
        const activityStats = getRepoActivityStats('com.enonic.cms.' + project.id);

        activityStats.forEach((bucket) => {
            const dateKey = bucket.key;
            const totalThisDate = activityMap.get(dateKey) || 0;
            activityMap.set(dateKey, totalThisDate + bucket.docCount);
        });
    });

    const result = {};

    activityMap.forEach((value, key) => {
        result[key] = value;
    });

    return result;
}

const generateActivityMap = () => {
    const activityMap = new Map();

    for (let i = daysAgo; i >= 0; i--) {
        activityMap.set(getFormattedDateXDaysAgo(i), 0);
    }

    return activityMap;
}

const getRepoActivityStats = (repositoryId) => {
    return contextLib.run(
        {
            repository: repositoryId,
            branch: 'draft'
        },
        () => {
            return fetchByDayStats();
        }
    );
}

const fetchByDayStats = () => {
    const result = contentLib.query({
        start: 0,
        count: 0,
        query: {
            'range': {
                'field': 'modifiedTime',
                'type': 'dateTime',
                'gt': dateFilterValue
            }
        },
        filters: {
            'boolean': {
                'mustNot': {
                    'hasValue': {
                        'field': 'modifier',
                        'values': [
                            'user:system:anonymous'
                        ]
                    }
                }
            }
        },
        aggregations: {
            by_day: {
                dateHistogram: {
                    field: 'modifiedTime',
                    interval: '1d',
                    minDocCount: 0,
                    format: 'yyyy-MM-dd'
                }
            }
        }
    });

    return result.aggregations.by_day.buckets;
}

exports.get = handleGet;
