import type {ContentSummary} from '../../content/ContentSummary';
import {ManagedActionManager} from '@enonic/lib-admin-ui/managedaction/ManagedActionManager';
import {Permission} from '../../access/Permission';
import {PublishStatus} from '../../publish/PublishStatus';
import {calcTreePublishStatus, calcSecondaryStatus} from '../../../v6/features/utils/cms/content/status';

function isOnline(content: ContentSummary): boolean {
    return calcTreePublishStatus(content) === PublishStatus.ONLINE && !calcSecondaryStatus(PublishStatus.ONLINE, content);
}

function isPublished(content: ContentSummary): boolean {
    return !!content.getPublishFirstTime();
}

function canBeMarkedAsReady(content: ContentSummary): boolean {
    return !isOnline(content) && content.isValid() && !content.isReady();
}

export class ContentTreeGridItemsState {

    private items: ContentSummary[] = [];

    private allowedPermissions: Permission[] = [];

    private anyDeletable: boolean = false;

    private anyEditable: boolean = false;

    private anyInherited: boolean = false;

    private allInherited: boolean = false;

    private allValid: boolean = false;

    private allOnline: boolean = false;

    private anyPublished: boolean = false;

    private allLeafs: boolean = false;

    private oneNonLeaf: boolean = false;

    private anyValidNonOnline: boolean = false;

    private anyCanBeMarkedAsReady: boolean = false;

    private createAllowed: boolean = false;

    private deleteAllowed: boolean = false;

    private modifyAllowed: boolean = false;

    private publishAllowed: boolean = false;

    private anyInProgress: boolean = false;

    private allReadOnly: boolean = false;

    private managedActionExecuting: boolean = false;

    constructor(items: ContentSummary[], allowedPermissions: Permission[]) {
        this.setItems(items, allowedPermissions);
    }

    setItems(items: ContentSummary[], allowedPermissions: Permission[]) {
        this.items = items;
        this.allowedPermissions = allowedPermissions;
        this.reset();
        this.update();
    }

    private reset() {
        this.anyDeletable = false;
        this.anyInherited = false;
        this.allInherited = this.items.length > 0;
        this.anyEditable = false;
        this.allValid = true;
        this.allOnline = this.items.length > 0;
        this.anyPublished = false;
        this.allLeafs = this.items.length > 0;
        this.oneNonLeaf = this.items.length === 1 && this.items[0].hasChildren();
        this.anyValidNonOnline = false;
        this.anyCanBeMarkedAsReady = false;
        this.anyInProgress = false;
        this.allReadOnly = true;
        this.managedActionExecuting = ManagedActionManager.instance().isExecuting();
    }

    private update() {
        this.createAllowed = this.isCreateAllowed();
        this.deleteAllowed = this.isDeleteAllowed();
        this.modifyAllowed = this.isModifyAllowed();
        this.publishAllowed = this.isPublishAllowed();

        this.items.forEach((content: ContentSummary) => {
            const online = isOnline(content);

            if (!online) {
                this.allOnline = false;

                if (content.isValid()) {
                    this.anyValidNonOnline = true;
                }
            }

            if (!content.isValid()) {
                this.allValid = false;
            }

            if (content.isEditable()) {
                this.anyEditable = true;
            }

            if (isPublished(content)) {
                this.anyPublished = true;
            }

            if (content.hasChildren()) {
                this.allLeafs = false;
            }

            if (content.isDataInherited()) {
                this.anyInherited = true;
            } else {
                this.allInherited = false;
            }

            if (canBeMarkedAsReady(content)) {
                this.anyCanBeMarkedAsReady = true;
            }

            if (content.isDeletable()) {
                this.anyDeletable = true;
            }

            if (content.isInProgress()) {
                this.anyInProgress = true;
            }

            if (!content.isReadOnly()) {
                this.allReadOnly = false;
            }
        });
    }

    private isCreateAllowed(): boolean {
        return this.allowedPermissions.indexOf(Permission.CREATE) > -1;
    }

    private isDeleteAllowed(): boolean {
        return this.allowedPermissions.indexOf(Permission.DELETE) > -1 && !this.managedActionExecuting;
    }

    private isPublishAllowed(): boolean {
        return this.allowedPermissions.indexOf(Permission.PUBLISH) > -1 && !this.managedActionExecuting;
    }

    private isModifyAllowed(): boolean {
        return this.allowedPermissions.indexOf(Permission.MODIFY) > -1 && !this.managedActionExecuting;
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
        return this.allOnline;
    }

    hasValidNonOnline(): boolean {
        return this.anyValidNonOnline;
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

    hasAnyDeletable(): boolean {
        return this.anyDeletable;
    }

    hasAllInherited(): boolean {
        return this.allInherited;
    }

    canCreate(): boolean {
        return this.createAllowed;
    }

    canDelete(): boolean {
        return this.deleteAllowed;
    }

    canModify(): boolean {
        return this.modifyAllowed;
    }

    canPublish(): boolean {
        return this.publishAllowed;
    }

    hasAnyInProgress(): boolean {
        return this.anyInProgress;
    }

    hasAllReadOnly(): boolean {
        return this.allReadOnly;
    }

    isManagedActionExecuting(): boolean {
        return this.managedActionExecuting;
    }

    isReadyForPublishing(): boolean {
        return !this.isEmpty() && !this.isManagedActionExecuting() && this.canPublish() &&
               !this.hasAllOnline() && this.hasValidNonOnline() &&
               (this.canModify() || !this.hasAnyInProgress());
    }

    total(): number {
        return this.items.length;
    }
}
