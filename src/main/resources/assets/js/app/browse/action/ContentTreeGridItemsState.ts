import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ManagedActionManager} from 'lib-admin-ui/managedaction/ManagedActionManager';

export class ContentTreeGridItemsState {

    private items: ContentSummaryAndCompareStatus[] = [];

    private anyDeletable: boolean = false;

    private anyEditable: boolean = false;

    private anyInherited: boolean = false;

    private allValid: boolean = false;

    private allAreOnline: boolean = false;

    private allPendingDelete: boolean = false;

    private anyPendingDelete: boolean = false;

    private anyPublished: boolean = false;

    private allLeafs: boolean = false;

    private oneNonLeaf: boolean = false;

    private anyValidNonOnline: boolean = false;

    private anyCanBeMarkedAsReady: boolean = false;

    private anyCanBeRequestedToPublish: boolean = false;

    private managedActionExecuting: boolean = false;

    constructor(items: ContentSummaryAndCompareStatus[]) {
        this.setItems(items);
    }

    setItems(items: ContentSummaryAndCompareStatus[]) {
        this.items = items;
        this.reset();
        this.update();
    }

    private reset() {
        this.anyDeletable = false;
        this.anyInherited = false;
        this.anyEditable = false;
        this.allValid = true;
        this.allAreOnline = this.items.length > 0;
        this.allPendingDelete = this.items.length > 0;
        this.anyPendingDelete = false;
        this.anyPublished = false;
        this.allLeafs = this.items.length > 0;
        this.oneNonLeaf = this.items.length === 1 && this.items[0].hasChildren();
        this.anyValidNonOnline = false;
        this.anyCanBeMarkedAsReady = false;
        this.anyCanBeRequestedToPublish = false;
        this.managedActionExecuting = ManagedActionManager.instance().isExecuting();
    }

    private update() {
        this.items.forEach((content: ContentSummaryAndCompareStatus) => {
            if (!content.isOnline()) {
                this.allAreOnline = false;
                if (content.isValid()) {
                    this.anyValidNonOnline = true;
                }

                if (!content.isPendingDelete()) {
                    this.anyCanBeRequestedToPublish = true;
                }
            }

            if (!content.isValid()) {
                this.allValid = false;
            }

            if (!content.isReadOnly() && content.isEditable()) {
                this.anyEditable = true;
            }

            if (!content.isPendingDelete()) {
                this.allPendingDelete = false;
            }

            if (content.isPendingDelete()) {
                this.anyPendingDelete = true;
            }

            if (content.isPublished()) {
                this.anyPublished = true;
            }

            if (content.hasChildren()) {
                this.allLeafs = false;
            }

            if (content.isInherited()) {
                this.anyInherited = true;
            }

            if (content.canBeMarkedAsReady()) {
                this.anyCanBeMarkedAsReady = true;
            }

            if (content.isDeletable()) {
                this.anyDeletable = true;
            }

        });
    }

    isSingle(): boolean {
        return this.items.length === 1;
    }

    isMultiple(): boolean {
        return this.items.length > 1;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    isSingleNonLeaf(): boolean {
        return this.oneNonLeaf;
    }

    hasAllLeafs(): boolean {
        return this.allLeafs;
    }

    hasAnyPublished(): boolean {
        return this.anyPublished;
    }

    hasAllOnline(): boolean {
        return this.allAreOnline;
    }

    hasValidNonOnline(): boolean {
        return this.anyValidNonOnline;
    }

    hasAnyPendingDelete(): boolean {
        return this.anyPendingDelete;
    }

    hasAllPendingDelete(): boolean {
        return this.allPendingDelete;
    }

    hasAnyEditable(): boolean {
        return this.anyEditable;
    }

    hasAnyInherited(): boolean {
        return this.anyInherited;
    }

    hasAllValid(): boolean {
        return this.allValid;
    }

    hasAnyCanBeMarkedAsReady(): boolean {
        return this.anyCanBeMarkedAsReady;
    }

    hasAnyCanBeRequestedToPublish(): boolean {
        return this.anyCanBeRequestedToPublish;
    }

    hasAnyDeletable(): boolean {
        return this.anyDeletable;
    }

    isManagedActionExecuting(): boolean {
        return this.managedActionExecuting;
    }
}
