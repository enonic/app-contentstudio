export enum IssueType {
    STANDARD, PUBLISH_REQUEST
}

export class IssueTypeFormatter {
    static parseType(value: string): IssueType | undefined {
        // Works for number based enums only
        if (IssueType[IssueType.STANDARD] === value) {
            return IssueType.STANDARD;
        } else if (IssueType[IssueType.PUBLISH_REQUEST]) {
            return IssueType.PUBLISH_REQUEST;
        }
        return undefined;
    }

    static getTypeName(value: IssueType): string {
        switch(value) {
            case IssueType.STANDARD:
                return IssueType[IssueType.STANDARD];
            case IssueType.PUBLISH_REQUEST:
                return IssueType[IssueType.PUBLISH_REQUEST];
            default:
                return '';
        }
    }

    static parseTypeName(value: IssueType): string {
        const typeName = this.getTypeName(value);
        return typeName.toLowerCase().replace(/_/g, '-');
    }
}
