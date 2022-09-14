const projectLib = require('/lib/xp/project');
const mustache = require('/lib/mustache');
const contextLib = require('/lib/xp/context');
const portalLib = require('/lib/xp/portal');
const adminLib = require('/lib/xp/admin');
const issueFetcher = __.newBean('com.enonic.xp.app.contentstudio.widget.issues.IssueFetcher');

const handleGet = (req) => {
    const showLast = req.params.showLast || 5;
    const view = resolve('./issues.html');
    const issues = getLastModifiedIssues(showLast);
    const sortedByDateIssues = sortIssuesByDate(issues);

    const params = {
        issues: sortedByDateIssues.slice(0, showLast),
        stylesUri: portalLib.assetUrl({
            path: 'styles/widgets/issues.css'
        })
    };

    return {
        contentType: 'text/html',
        body: mustache.render(view, params),
    };
}

const getLastModifiedIssues = (showLast) => {
    const result = [];
    const projects = projectLib.list();
    const baseToolUri = adminLib.getToolUrl(app.name, 'main');

    projects.forEach((project) => {
        const findIssuesResult = getLastModifiedIssuesInRepo(`com.enonic.cms.${project.id}`, showLast);

        findIssuesResult.getIssues().forEach((issue) => {
            result.push(createIssueItem(issue, project, baseToolUri));
        });
    });

    return result;
}

const getLastModifiedIssuesInRepo = (repositoryId, count) => {
    return contextLib.run(
        {
            repository: repositoryId,
            branch: 'draft'
        },
        () => {
            return issueFetcher.list(count);
        }
    );
}

const createIssueItem = (issue, project, baseToolUri) => {
    const modifiedDateTime = parseDateTime(issue.modifiedTime.toString());
    const modifiedText = generateModifiedText(issue, modifiedDateTime);
    const editUrl = generateEditUrl(issue.id, project.id, baseToolUri);
    const name = generateNameWithId(issue);
    const imgUrl = generateImgUrl(issue);
    const projectDisplayName = project.displayName;

    return {
        issue: issue,
        name: name,
        dateTime: modifiedDateTime,
        modifiedText: modifiedText,
        editUrl: editUrl,
        imgUrl: imgUrl,
        projectDisplayName: projectDisplayName
    }
}

const parseDateTime = (value) => {
    if (!value) {
        return '';
    }

    return makeDateFromUTCString(value);
}

// Copied from DateHelper.ts
const makeDateFromUTCString = (value) => {
    const parsedYear = Number(value.substring(0, 4));
    const parsedMonth = Number(value.substring(5, 7));
    const parsedDayOfMonth = Number(value.substring(8, 10));
    const parsedHours = Number(value.substring(11, 13));
    const parsedMinutes = Number(value.substring(14, 16));
    const parsedSeconds = Number(value.substring(17, 19));

    return new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDayOfMonth, parsedHours, parsedMinutes, parsedSeconds));
}

const generateEditUrl = (id, project, baseToolUri) => {
    return `${baseToolUri}#/${project}/issue/${id}`;
}

const generateModifiedText = (issue, modifiedDate) => {
    const action = issue.modifier ? 'Updated' : 'Opened';
    const text = getModifiedString(modifiedDate);
    return `${action} by me ${text}`;
}

// copied from DateHelper.ts
const getModifiedString = (modified) => {
    const timeDiff = Math.abs(Date.now() - modified.getTime());
    const secInMs = 1000;
    const minInMs = secInMs * 60;
    const hrInMs = minInMs * 60;
    const dayInMs = hrInMs * 24;
    const monInMs = dayInMs * 31;
    const yrInMs = dayInMs * 365;

    if (timeDiff < minInMs) {
        return 'less than a minute ago';
    }

    if (timeDiff < 2 * minInMs) {
        return 'a minute ago';
    }

    if (timeDiff < hrInMs) {
        return `${divideAndFloor(timeDiff, minInMs)} minutes ago`;
    }

    if (timeDiff < 2 * hrInMs) {
        return 'over an hour ago';
    }

    if (timeDiff < dayInMs) {
        return `over ${divideAndFloor(timeDiff, hrInMs)} hours ago`;
    }

    if (timeDiff < 2 * dayInMs) {
        return 'over a day ago';
    }

    if (timeDiff < monInMs) {
        return `over ${divideAndFloor(timeDiff, dayInMs)} days ago`;
    }

    if (timeDiff < 2 * monInMs) {
        return 'over a month ago';
    }

    if (timeDiff < yrInMs) {
        return `over ${divideAndFloor(timeDiff, monInMs)} months ago`;
    }

    if (timeDiff < 2 * yrInMs) {
        return 'over a year ago';
    }

    return `over ${divideAndFloor(timeDiff, yrInMs)} years ago`;
}

const divideAndFloor = (n1, n2) => {
    return ~~(n1 / n2);
}

const generateNameWithId = (issue) => {
    return issue.title;
}

const generateImgUrl = (issue) => {
    const type = issue.issueType == 'STANDARD' ? 'issue' : 'publish';

    const imgUri = portalLib.assetUrl({
        path: `styles/widgets/icons/${type}.svg`
    });

    return imgUri;
}

const sortIssuesByDate = (items) => {
    return items.sort((item1, item2) => {
        return item2.dateTime - item1.dateTime;
    });
}

exports.get = handleGet;
