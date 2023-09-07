import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ContentTreeGrid} from '../browse/ContentTreeGrid';
import {ContentSummary} from '../content/ContentSummary';

export class ContentMovePromptEvent
    extends Event {

    private readonly content: ContentSummary[];

    private readonly treeGrid: ContentTreeGrid | undefined;

    constructor(content: ContentSummary[], treeGrid?: ContentTreeGrid) {
        super();
        this.content = content;
        this.treeGrid = treeGrid;
    }

    getContentSummaries(): ContentSummary[] {
        return this.content;
    }

    getTreeGrid(): ContentTreeGrid | undefined {
        return this.treeGrid;
    }

    static on(handler: (event: ContentMovePromptEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ContentMovePromptEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
