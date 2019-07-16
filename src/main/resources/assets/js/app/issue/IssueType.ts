export enum IssueType {
    STANDARD, PUBLISH_REQUEST
}

export class IssueTypeFormatter {
    public static parseType(value: string): IssueType {
        switch (value) {
        case 'STANDARD':
            return IssueType.STANDARD;
        case 'PUBLISH_REQUEST':
            return IssueType.PUBLISH_REQUEST;
        default:
            return null;
        }
    }

    public static parseTypeName(value: IssueType): string {
        switch (value) {
        case IssueType.STANDARD:
            return 'standard';
        case IssueType.PUBLISH_REQUEST:
            return 'publish-request';
        default:
            return '';
        }
    }
}
