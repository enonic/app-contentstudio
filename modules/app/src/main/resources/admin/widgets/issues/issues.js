const mustache = require('/lib/mustache');
const portalLib = require('/lib/xp/portal');
const adminLib = require('/lib/xp/admin');
const authLib = require('/lib/xp/auth');
const helper = require('/helpers/dashboard-helper');

const baseToolUri = adminLib.getToolUrl(app.name, 'main');

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
    const projects = helper.getProjects();

    projects.forEach((project) => {
        const findIssuesResult = helper.getIssuesInRepo(`com.enonic.cms.${project.id}`, showLast, authLib.getUser()['key']);

        findIssuesResult.getIssues().forEach((issue) => {
            result.push(createIssueItem(issue, project));
        });
    });

    return result;
}

const createIssueItem = (issue, project) => {
    const modifiedDateTime = helper.parseDateTime(issue.modifiedTime.toString());
    const modifiedText = generateModifiedText(issue, modifiedDateTime);
    const issueUrl = generateIssueUrl(issue.id, project.id);
    const projectUrl = generateProjectUrl(project.id);
    const name = generateNameWithId(issue);
    const imgUrl = generateImgUrl(issue);
    const projectDisplayName = project.displayName;

    return {
        issue,
        name,
        dateTime: modifiedDateTime,
        modifiedText,
        issueUrl,
        projectUrl,
        imgUrl,
        projectDisplayName
    }
}

const generateIssueUrl = (id, project) => {
    return `${baseToolUri}#/${project}/issue/${id}`;
}

const generateProjectUrl = (project) => {
    return `${baseToolUri}#/${project}/browse`;
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
