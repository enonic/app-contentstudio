import type {PrincipalKey} from '@enonic-types/core';
import type {Project} from '/lib/xp/project';

import {list} from '/lib/xp/project';
import {run} from '/lib/xp/context';


const issueFetcher = __.newBean<{
    list(count: number, principalKey: string): {
        getIssues(): unknown[]
    };
}>('com.enonic.xp.app.contentstudio.widget.issues.IssueFetcher');


export const getIssuesInRepo = (repositoryId: string, count?: number, principalKey?: PrincipalKey) => {
    return run(
        {
            repository: repositoryId,
            branch: 'draft'
        },
        () => issueFetcher.list(count || -1, principalKey || null)
    );
}

export const getProjects = <Config extends Record<string, unknown> = Record<string, unknown>>(): Project<Config>[] => {
    const projects = list() as Project<Config>[];
    const hideDefaultProject = app.config['settings.hideDefaultProject'] === 'true' || false;

    if (hideDefaultProject) {
        return projects.filter((p) => p.id !== 'default');
    }

    return projects;
}

export const parseDateTime = (value: string): Date | undefined => {
    if (!value) {
        return undefined;
    }

    return makeDateFromUTCString(value);
}

// Copied from DateHelper.ts
const makeDateFromUTCString = (value: string) => {
    const parsedYear = Number(value.substring(0, 4));
    const parsedMonth = Number(value.substring(5, 7));
    const parsedDayOfMonth = Number(value.substring(8, 10));
    const parsedHours = Number(value.substring(11, 13));
    const parsedMinutes = Number(value.substring(14, 16));
    const parsedSeconds = Number(value.substring(17, 19));

    return new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDayOfMonth, parsedHours, parsedMinutes, parsedSeconds));
}

export const formatDateTime = (date: Date): string => {
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
const zeroPad = (n: number, width: number) => {
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
