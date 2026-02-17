import {type ViewItem} from '@enonic/lib-admin-ui/app/view/ViewItem';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type CompareStatus} from '../content/CompareStatus';
import {type ContentId} from '../content/ContentId';
import {type ContentName} from '../content/ContentName';
import {type ContentPath} from '../content/ContentPath';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {type ContentSummaryJson} from '../content/ContentSummaryJson';
import {type ContentAvailabilityStatus} from '../inputtype/selector/ContentAvailabilityStatus';
import {type PublishStatus} from '../publish/PublishStatus';

export class ContentTreeSelectorItemJson {

    content: ContentSummaryJson;

    selectable: boolean;

    expandable: boolean;
}

export class ContentTreeSelectorItem
    implements Equitable, ViewItem {

    private readonly content: ContentSummaryAndCompareStatus;

    private readonly selectable: boolean;

    private readonly expandable: boolean;

    private readonly availabilityStatus: ContentAvailabilityStatus;

    constructor(builder: ContentTreeSelectorItemBuilder) {
        this.content = builder.content;
        this.selectable = ObjectHelper.isDefined(builder.selectable) ? builder.selectable : true;
        this.expandable = ObjectHelper.isDefined(builder.expandable) ? builder.expandable : true;
        this.availabilityStatus = builder.availabilityStatus || 'OK';
    }

    getIconClass(): string {
        return '';
    }

    public static fromJson(json: ContentTreeSelectorItemJson) {
        return new ContentTreeSelectorItemBuilder().fromJson(json).build();
    }

    getContent(): ContentSummaryAndCompareStatus {
        return this.content;
    }

    getContentSummary(): ContentSummary {
        return this.content ? this.content.getContentSummary() : null;
    }

    getCompareStatus(): CompareStatus {
        return this.content ? this.content.getCompareStatus() : null;
    }

    getPublishStatus(): PublishStatus {
        return this.content ? this.content.getPublishStatus() : null;
    }

    getId(): string {
        return this.content ? this.content.getId() : null;
    }

    getContentId(): ContentId {
        return this.content ? this.content.getContentId() : null;
    }

    getPath(): ContentPath {
        return this.content ? this.content.getPath() : null;
    }

    getName(): ContentName {
        return this.content ? this.content.getContentSummary()?.getName() : null;
    }

    getDisplayName(): string {
        return this.content ? this.content.getDisplayName() : null;
    }

    hasChildren(): boolean {
        return this.content ? this.content.hasChildren() : null;
    }

    isValid(): boolean {
        return this.content ? this.content.isValid() : null;
    }

    getIconUrl(): string {
        return this.content ? this.content.getIconUrl() : null;
    }

    getType(): ContentTypeName {
        return this.content ? this.content.getType() : null;
    }

    isImage(): boolean {
        return this.content?.getContentSummary()?.isImage();
    }

    isSite(): boolean {
        return this.content?.getContentSummary()?.isSite()
    }

    getLanguage(): string {
        return this.content ? this.content.getLanguage() : null;
    }

    isSelectable(): boolean {
        return this.selectable;
    }

    isExpandable(): boolean {
        return this.expandable;
    }

    getAvailabilityStatus(): ContentAvailabilityStatus {
        return this.availabilityStatus;
    }

    isAvailable(): boolean {
        return this.availabilityStatus === 'OK';
    }

    isNotFound(): boolean {
        return this.availabilityStatus === 'NOT_FOUND';
    }

    isNoAccess(): boolean {
        return this.availabilityStatus === 'NO_ACCESS';
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ClassHelper.getClass(this))) {
            return false;
        }

        const other = o as ContentTreeSelectorItem;

        if (!ObjectHelper.equals(this.content, other.content)) {
            return false;
        }

        if (this.selectable !== other.selectable) {
            return false;
        }

        if (this.expandable !== other.expandable) {
            return false;
        }

        return this.availabilityStatus === other.availabilityStatus;
    }

    static create(): ContentTreeSelectorItemBuilder {
        return new ContentTreeSelectorItemBuilder();
    }
}

export class ContentTreeSelectorItemBuilder {

    content: ContentSummaryAndCompareStatus;

    selectable: boolean = true;

    expandable: boolean = true;

    availabilityStatus: ContentAvailabilityStatus = 'OK';

    setContent(content: ContentSummaryAndCompareStatus): this {
        this.content = content;
        return this;
    }

    setSelectable(selectable: boolean): this {
        this.selectable = selectable;
        return this;
    }

    setExpandable(expandable: boolean): this {
        this.expandable = expandable;
        return this;
    }

    setAvailabilityStatus(availabilityStatus: ContentAvailabilityStatus): this {
        this.availabilityStatus = availabilityStatus;
        return this;
    }

    fromJson(json: ContentTreeSelectorItemJson): ContentTreeSelectorItemBuilder {
        return new ContentTreeSelectorItemBuilder().setContent(
            ContentSummaryAndCompareStatus.fromContentSummary(ContentSummary.fromJson(json.content))).setSelectable(
            json.selectable).setExpandable(json.expandable);
    }

    build(): ContentTreeSelectorItem {
        return new ContentTreeSelectorItem(this);
    }
}
