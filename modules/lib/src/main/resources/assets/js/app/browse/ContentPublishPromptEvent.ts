import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {type ContentId} from '../content/ContentId';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {BaseContentModelEvent} from './BaseContentModelEvent';

export interface ContentPublishPromptEventConfig {
    model: ContentSummaryAndCompareStatus[];
    includeChildItems?: boolean;
    exceptedContentIds?: ContentId[];
    excludedIds?: ContentId[];
    keepDependencies?: boolean;
    message?: string;
}

export class ContentPublishPromptEvent
    extends BaseContentModelEvent {

    private includeChildItems: boolean;

    private exceptedContentIds: ContentId[];

    private excludedIds: ContentId[];

    private keepDependencies: boolean;

    private message: string;

    constructor(config: ContentPublishPromptEventConfig) {
        super(config.model);
        this.includeChildItems = config.includeChildItems != null ? config.includeChildItems : false;
        this.exceptedContentIds = config.exceptedContentIds;
        this.excludedIds = config.excludedIds;
        this.keepDependencies = config.keepDependencies != null ? config.keepDependencies : false;
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

    isKeepDependencies(): boolean {
        return this.keepDependencies;
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
