import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ContentTreeGrid} from '../browse/ContentTreeGrid';
import {ContentSummary} from '../content/ContentSummary';

export class OpenMoveDialogEvent
    extends Event {
    private content: ContentSummary[];
    private treeGrid: ContentTreeGrid;

    constructor(content: ContentSummary[], treeGrid?: ContentTreeGrid) {
        super();
        this.content = content;
        this.treeGrid = treeGrid;
    }

    getContentSummaries(): ContentSummary[] {
        return this.content;
    }

    getTreeGrid(): ContentTreeGrid {
        return this.treeGrid;
    }

    static on(handler: (event: OpenMoveDialogEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: OpenMoveDialogEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
