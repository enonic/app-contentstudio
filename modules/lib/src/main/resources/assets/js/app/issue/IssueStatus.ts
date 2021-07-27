import {i18n} from 'lib-admin-ui/util/Messages';

export enum IssueStatus {
    OPEN, CLOSED
}

export class IssueStatusFormatter {
    public static formatStatus(issueStatus: IssueStatus): string {
        const statusName = IssueStatus[issueStatus] || 'unknown';
        const status = statusName.toLowerCase();
        return i18n(`field.issue.status.${status}`);
    }

    static fromString(value: string): IssueStatus | null {
        switch (value) {
        case i18n('field.issue.status.open'):
            return IssueStatus.OPEN;
        case i18n('field.issue.status.closed'):
            return IssueStatus.CLOSED;
        default:
            return null;
        }
    }

    static parseStatus(value: string): IssueStatus | undefined {
        return (<any>IssueStatus)[value];
    }

    static parseStatusName(value: IssueStatus): string {
        const statusName = IssueStatus[value] || '';
        return statusName.toLowerCase().replace(/_/g, '-');
    }

    static getStatuses(): IssueStatus[] {
        const statuses = [];

        // Polyfill for browsers not supporting ES6
        Number.isInteger = Number.isInteger || function (value: any) {
            return typeof value === 'number' &&
                   isFinite(value) &&
                   Math.floor(value) === value;
        };

        for (let key in IssueStatus) {
            if (Number.isInteger(<any>IssueStatus[key]) && IssueStatus.hasOwnProperty(key)) {
                statuses.push(IssueStatus[key]);
            }
        }

        return statuses;
    }

    static getStatusNames(): string[] {
        return IssueStatusFormatter.getStatuses().map(IssueStatusFormatter.parseStatusName);
    }
}
