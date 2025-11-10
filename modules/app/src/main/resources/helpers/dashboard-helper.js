const projectLib = require('/lib/xp/project');
const issueFetcher = __.newBean('com.enonic.app.contentstudio.widget.issues.IssueFetcher');
const contextLib = require('/lib/xp/context');

const getIssuesInRepo = (repositoryId, count, principalKey) => {
    return contextLib.run(
        {
            repository: repositoryId,
            branch: 'draft'
        },
        () => issueFetcher.list(count || -1, principalKey || null)
    );
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

const formatDateTime = (date) => {
    if (!date) {
        return '';
    }

    return zeroPad(date.getFullYear(), 4) +
           '-' +
           zeroPad(date.getMonth() + 1, 2) +
           '-' +
           zeroPad(date.getDate(), 2) +
           ' ' +
           zeroPad(date.getHours(), 2) +
           ':' +
           zeroPad(date.getMinutes(), 2) +
           ':' +
           zeroPad(date.getSeconds(), 2);
}

// Copied from DateTimeFormatter.ts
const zeroPad = (n, width) => {
    let nWidth = n.toString().length;
    if (nWidth >= width) {
        return '' + n;
    }
    let neededZeroes = width - nWidth;
    let s = '';
    for (let i = 0; i < neededZeroes; i++) {
        s += '0';
    }

    return s + n;
}

exports.getProjects = getProjects;
exports.parseDateTime = parseDateTime;
exports.formatDateTime = formatDateTime;
exports.getIssuesInRepo = getIssuesInRepo;
