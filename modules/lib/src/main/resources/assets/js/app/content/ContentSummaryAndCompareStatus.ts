import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {CompareStatus, CompareStatusChecker, CompareStatusFormatter} from './CompareStatus';
import {PublishStatus, PublishStatusChecker} from '../publish/PublishStatus';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ViewItem} from '@enonic/lib-admin-ui/app/view/ViewItem';
import {ContentIconUrlResolver} from './ContentIconUrlResolver';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {ContentSummary, ContentSummaryBuilder} from './ContentSummary';
import {ContentInheritType} from './ContentInheritType';
import {ContentId} from './ContentId';
import {ContentPath} from './ContentPath';
import {ContentSummaryAndCompareStatusHelper} from './ContentSummaryAndCompareStatusHelper';
import {isEqual} from '../Diff';

export class ContentSummaryAndCompareStatus implements ViewItem, Cloneable {

    private uploadItem: UploadItem<ContentSummary>;

    private contentSummary: ContentSummary;

    private compareStatus: CompareStatus;

    private publishStatus: PublishStatus;

    private renderable: boolean = false;

    public static fromContentSummary(contentSummary: ContentSummary) {
        return new ContentSummaryAndCompareStatus().setContentSummary(contentSummary);
    }

    public static fromContentAndCompareStatus(contentSummary: ContentSummary, compareStatus: CompareStatus) {
        return new ContentSummaryAndCompareStatus().setContentSummary(contentSummary).setCompareStatus(compareStatus);
    }

    public static fromContentAndCompareAndPublishStatus(contentSummary: ContentSummary, compareStatus: CompareStatus,
                                                        publishStatus: PublishStatus) {
        const contentSummaryAndCompareStatus: ContentSummaryAndCompareStatus =
            ContentSummaryAndCompareStatus.fromContentAndCompareStatus(contentSummary, compareStatus);

        if (!contentSummaryAndCompareStatus.isNew()) {
            contentSummaryAndCompareStatus.setPublishStatus(publishStatus);
        }

        return contentSummaryAndCompareStatus;
    }

    public static fromUploadItem(item: UploadItem<ContentSummary>): ContentSummaryAndCompareStatus {
        return new ContentSummaryAndCompareStatus().setUploadItem(item);
    }

    public static isInArray(contentId: ContentId, array: ContentSummaryAndCompareStatus[]): boolean {
        return array.some((c) => c.getContentId().equals(contentId));
    }

    hasContentSummary(): boolean {
        return !!this.contentSummary;
    }

    getContentSummary(): ContentSummary {
        return this.contentSummary;
    }

    setContentSummary(contentSummary: ContentSummary): ContentSummaryAndCompareStatus {
        this.contentSummary = contentSummary;
        return this;
    }

    getCompareStatus(): CompareStatus {
        return this.compareStatus;
    }

    setCompareStatus(status: CompareStatus): ContentSummaryAndCompareStatus {
        this.compareStatus = status;
        return this;
    }

    getPublishStatus(): PublishStatus {
        return this.publishStatus;
    }

    setPublishStatus(publishStatus: PublishStatus): ContentSummaryAndCompareStatus {
        this.publishStatus = publishStatus;
        return this;
    }

    hasUploadItem(): boolean {
        return !!this.uploadItem;
    }

    getUploadItem(): UploadItem<ContentSummary> {
        return this.uploadItem;
    }

    setUploadItem(item: UploadItem<ContentSummary>): ContentSummaryAndCompareStatus {
        this.uploadItem = item;
        if (item.isUploaded()) {
            this.contentSummary = item.getModel();
        } else {
            item.onUploaded((contentSummary: ContentSummary) => {
                this.contentSummary = contentSummary;
            });
        }
        return this;
    }

    setRenderable(value: boolean): ContentSummaryAndCompareStatus {
        this.renderable = value;
        return this;
    }

    isRenderable(): boolean {
        return this.renderable;
    }

    getContentId(): ContentId {
        return this.contentSummary ? this.contentSummary.getContentId() : null;
    }

    getId(): string {
        return (this.contentSummary && this.contentSummary.getId()) ||
               (this.uploadItem && this.uploadItem.getId()) ||
               '';
    }

    getPath(): ContentPath {
        return this.contentSummary ? this.contentSummary.getPath() : null;
    }

    getType(): ContentTypeName {
        return this.contentSummary ? this.contentSummary.getType() : null;
    }

    getDisplayName(): string {
        return this.contentSummary ? this.contentSummary.getDisplayName() : null;
    }

    getLanguage(): string {
        return this.contentSummary?.getLanguage();
    }

    getIconUrl(): string {
        return this.contentSummary ? new ContentIconUrlResolver().setContent(this.contentSummary).resolve() : null;
    }

    getIconClass(): string {
        return '';
    }

    hasChildren(): boolean {
        return !!this.contentSummary ? this.contentSummary.hasChildren() : false;
    }

    hasOriginProject(): boolean {
        return !!this.contentSummary && !!this.contentSummary.getOriginProject();
    }

    getOriginProject(): string {
        return !!this.contentSummary ? this.contentSummary.getOriginProject() : null;
    }

    isInherited(): boolean {
        return !!this.contentSummary ? this.contentSummary.isInherited() : false;
    }

    isFullyInherited(): boolean {
        return (this.getInherit().length * 2) === Object.keys(ContentInheritType).length;
    }

    getInherit(): ContentInheritType[] {
        return this.contentSummary?.getInherit() || [];
    }

    isDataInherited(): boolean {
        return !!this.contentSummary?.isDataInherited();
    }

    isSortInherited(): boolean {
        return !!this.contentSummary ? this.contentSummary.isSortInherited() : false;
    }

    isParentInherited(): boolean {
        return !!this.contentSummary ? this.contentSummary.isParentInherited() : false;
    }

    isNameInherited(): boolean {
        return !!this.contentSummary ? this.contentSummary.isNameInherited() : false;
    }

    isValid(): boolean {
        return !!this.contentSummary ? this.contentSummary.isValid() : false;
    }

    isDeletable(): boolean {
        return !!this.contentSummary ? this.contentSummary.isDeletable() : false;
    }

    isEditable(): boolean {
        return !!this.contentSummary ? this.contentSummary.isEditable() : false;
    }

    isVariant(): boolean {
        return this.contentSummary?.isVariant();
    }

    getStatusText(): string {
        if (this.isUnpublished()) {
            return i18n('status.unpublished');
        }

        if (this.isNew()) {
            return i18n('status.new');
        }

        if (this.isPublished() || this.isModified()) {
            if (this.isScheduledPublishing()) {
                return i18n('status.published.scheduled');
            }
            if (this.isExpiredPublishing()) {
                return i18n('status.published.expired');
            }
        }

        if (this.isMovedAndModified()) {
            return `${CompareStatusFormatter.formatStatusText(CompareStatus.MOVED)}, ${CompareStatusFormatter.formatStatusText(CompareStatus.NEWER)}`;
        }

        return CompareStatusFormatter.formatStatusText(this.getCompareStatus());
    }

    getStatusClass(): string {

        if (this.isUnpublished()) {
            return 'offline';
        }

        if (this.isNew()) {
            return 'new';
        }

        const publishStatus: PublishStatus = this.getPublishStatus();

        if (PublishStatusChecker.isScheduled(publishStatus) || PublishStatusChecker.isExpired(publishStatus)) {
            return publishStatus;
        }

        let statusClass: string = CompareStatusFormatter.formatStatusClass(this.getCompareStatus());

        if (this.isMovedAndModified()) {
            // Use the same class on "Moved, Modified" as on "Modified"
            statusClass = CompareStatusFormatter.formatStatusClass(CompareStatus.NEWER);
        }

        return statusClass.replace('_', '-').replace(' ', '_') || 'unknown';
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentSummaryAndCompareStatus)) {
            return false;
        }

        const other = o as ContentSummaryAndCompareStatus;
        const diff = ContentSummaryAndCompareStatusHelper.diff(this, other);
        return isEqual(diff);
    }

    setReadOnly(value: boolean) {
        this.contentSummary?.setReadOnly(value);
    }

    isReadOnly(): boolean {
        return !!this.contentSummary ? this.contentSummary.isReadOnly() : false;
    }

    isPendingDelete(): boolean {
        return CompareStatusChecker.isPendingDelete(this.getCompareStatus());
    }

    isPublished(): boolean {
        return !!this.getCompareStatus() && CompareStatusChecker.isPublished(this.getCompareStatus());
    }

    isOnline(): boolean {
        return CompareStatusChecker.isOnline(this.getCompareStatus());
    }

    isNew(): boolean {
        return CompareStatusChecker.isNew(this.getCompareStatus());
    }

    isUnpublished(): boolean {
        return this.isNew() && !!this.getContentSummary().getPublishFirstTime();
    }

    isModified(): boolean {
        return CompareStatusChecker.isModified(this.getCompareStatus());
    }

    isScheduledPublishing(): boolean {
        return PublishStatusChecker.isScheduled(this.getPublishStatus());
    }

    isExpiredPublishing(): boolean {
        return PublishStatusChecker.isExpired(this.getPublishStatus());
    }

    isMoved(): boolean {
        return CompareStatusChecker.isMoved(this.getCompareStatus());
    }

    isMovedAndModified(): boolean {
        return CompareStatusChecker.isMoved(this.getCompareStatus()) && this.contentSummary?.isInProgress();
    }

    canBeMarkedAsReady(): boolean {
        if (!this.contentSummary) {
            return false;
        }

        return !this.isOnline() && this.contentSummary.isValid() && !this.contentSummary.isReady();
    }

    clone(): ContentSummaryAndCompareStatus {
        const contentSummary = new ContentSummaryBuilder(this.getContentSummary()).build();
        const clone = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
            contentSummary,
            this.compareStatus,
            this.publishStatus
        );
        clone.setRenderable(this.renderable);
        return clone;
    }
}
