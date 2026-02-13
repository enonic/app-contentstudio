import {i18n} from '@enonic/lib-admin-ui/util/Messages';

import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';

export class NewContentDialogListItem {

    private readonly contentType: ContentTypeSummary;
    private readonly name: string;
    private readonly displayName: string;
    private readonly iconUrl: string;
    private readonly description: string;
    private readonly searchIndex: string;

    static fromContentType(contentType: ContentTypeSummary): NewContentDialogListItem {
        return new NewContentDialogListItem(contentType);
    }

    constructor(contentType: ContentTypeSummary) {
        this.contentType = contentType;

        this.name = contentType.getName();
        this.displayName = contentType.getDisplayName();
        this.iconUrl = contentType.getIconUrl();
        this.description = contentType.getDescription() ? contentType.getDescription() : `<${i18n('text.noDescription')}>`;
        this.searchIndex = `${this.name.toLowerCase()}:${this.displayName.toLowerCase()}`;
    }

    getContentType(): ContentTypeSummary {
        return this.contentType;
    }

    isSite(): boolean {
        return this.contentType.isSite();
    }

    getName(): string {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getIconUrl(): string {
        return this.iconUrl;
    }

    getDescription(): string {
        return this.description;
    }

    getSearchIndex(): string {
        return this.searchIndex;
    }
}
