import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatus} from '../content/CompareStatus';
import {Branch} from '../versioning/Branch';
import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';

export class ContentDeletedEvent
    extends Event {

    private contentDeletedItems: ContentDeletedItem[] = [];

    constructor() {
        super();
    }

    addItem(contentId: ContentId, contentPath: ContentPath, branch: Branch): ContentDeletedEvent {
        this.contentDeletedItems.push(new ContentDeletedItem(contentId, contentPath, branch));
        return this;
    }

    isEmpty(): boolean {
        return this.contentDeletedItems.length === 0;
    }

    fire(contextWindow: Window = window) {
        if (!this.isEmpty()) {
            super.fire(contextWindow);
        }
    }

    static on(handler: (event: ContentDeletedEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentDeletedEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}

export class ContentDeletedItem {

    private readonly contentPath: ContentPath;

    private readonly contentId: ContentId;

    private readonly branch: Branch;

    constructor(contentId: ContentId, contentPath: ContentPath, branch: Branch) {
        this.contentPath = contentPath;
        this.contentId = contentId;
        this.branch = branch;
    }

    public getBranch(): Branch {
        return this.branch;
    }

    public getContentPath(): ContentPath {
        return this.contentPath;
    }

    public getContentId(): ContentId {
        return this.contentId;
    }

    public getCompareStatus(): CompareStatus {
        throw new Error('Must be overridden by inheritors');
    }
}
