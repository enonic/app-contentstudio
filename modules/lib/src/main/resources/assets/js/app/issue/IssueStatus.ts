import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export enum IssueStatus {
    OPEN, CLOSED
}

export class IssueStatusFormatter {
    public static getFormattedStatus(issueStatus: IssueStatus): string {
        const statusName = IssueStatus[issueStatus] || 'unknown';
        return statusName.toLowerCase();
    }

    public static formatStatus(issueStatus: IssueStatus): string {
        return i18n(`field.issue.status.${IssueStatusFormatter.getFormattedStatus(issueStatus)}`);
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
        return IssueStatus[value];
    }

    static parseStatusName(value: IssueStatus): string {
        const statusName = IssueStatus[value] || '';
        return statusName.toLowerCase().replace(/_/g, '-');
    }

    static getStatuses(): IssueStatus[] {
        const statuses = [];
        for (let key in IssueStatus) {
            if (Number.isInteger(IssueStatus[key]) && IssueStatus.hasOwnProperty(key)) {
                statuses.push(IssueStatus[key]);
            }
        }

        return statuses;
    }

    static getStatusNames(): string[] {
        return IssueStatusFormatter.getStatuses().map(IssueStatusFormatter.parseStatusName);
    }
}
