import { type ContentTypeName, toContentTypeName } from '../../../shared/lib/cms/schema/contentTypeName';

export type ContentTypeSummaryJson = {
    name: string;
    title: string;
    description?: string;
    iconUrl?: string;
    abstract: boolean;
};

export type ContentTypeSummary = {
    readonly name: ContentTypeName;
    readonly title: string;
    readonly description?: string;
    readonly iconUrl?: string;
    readonly abstract: boolean;
};

export function parseContentTypeSummary(json: ContentTypeSummaryJson): ContentTypeSummary {
    return {
        name: toContentTypeName(json.name),
        title: json.title,
        description: json.description,
        iconUrl: json.iconUrl,
        abstract: json.abstract,
    };
}
