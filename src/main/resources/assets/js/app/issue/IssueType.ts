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
}
