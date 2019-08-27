export enum IssueType {
    STANDARD, PUBLISH_REQUEST
}

export class IssueTypeFormatter {
    static parseType(value: string): IssueType | undefined {
        return (<any>IssueType)[value];
    }

    static parseTypeName(value: IssueType): string {
        const typeName = IssueType[value] || '';
        return typeName.toLowerCase().replace(/_/g, '-');
    }
}
