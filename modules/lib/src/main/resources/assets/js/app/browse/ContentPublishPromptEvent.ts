import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from './BaseContentModelEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentId} from '../content/ContentId';

export interface ContentPublishPromptEventConfig {
    model: ContentSummaryAndCompareStatus[];
    includeChildItems?: boolean;
    exceptedContentIds?: ContentId[];
    excludedIds?: ContentId[];
    message?: string;
}

export class ContentPublishPromptEvent
    extends BaseContentModelEvent {

    private includeChildItems: boolean;

    private exceptedContentIds: ContentId[];

    private excludedIds: ContentId[];

    private message: string;

    constructor(config: ContentPublishPromptEventConfig) {
        super(config.model);
        this.includeChildItems = config.includeChildItems != null ? config.includeChildItems : false;
        this.exceptedContentIds = config.exceptedContentIds;
        this.excludedIds = config.excludedIds;
        this.message = config.message;
    }

    isIncludeChildItems(): boolean {
        return this.includeChildItems;
    }

    getExceptedContentIds(): ContentId[] {
        return this.exceptedContentIds;
    }

    getExcludedIds(): ContentId[] {
        return this.excludedIds;
    }

    getMessage(): string {
        return this.message;
    }

    static on(handler: (event: ContentPublishPromptEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentPublishPromptEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
