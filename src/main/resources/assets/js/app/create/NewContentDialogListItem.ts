import '../../api.ts';
import i18n = api.util.i18n;

import ContentTypeSummary = api.schema.content.ContentTypeSummary;

export class NewContentDialogListItem {

    private contentType: ContentTypeSummary;

    private name: string;
    private displayName: string;
    private iconUrl: string;
    private description: string;

    static fromContentType(contentType: ContentTypeSummary): NewContentDialogListItem {
        return new NewContentDialogListItem(contentType);
    }

    constructor(contentType: ContentTypeSummary) {
        this.contentType = contentType;

        this.name = contentType.getName();
        this.displayName = contentType.getDisplayName();
        this.iconUrl = contentType.getIconUrl();
        this.description = contentType.getDescription() ? contentType.getDescription() : `<${i18n('text.noDescription')}>`;
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
}
