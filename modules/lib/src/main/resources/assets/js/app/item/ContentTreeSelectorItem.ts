import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {ContentSummary} from '../content/ContentSummary';
import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';
import {ContentName} from '../content/ContentName';
import {ContentState} from '../content/ContentState';
import {ViewItem} from '@enonic/lib-admin-ui/app/view/ViewItem';

export class ContentTreeSelectorItemJson {

    content: ContentSummaryJson;

    selectable: boolean;

    expandable: boolean;
}

export class ContentTreeSelectorItem
    implements Equitable, ViewItem {

    private readonly content: ContentSummary;

    private readonly selectable: boolean;

    private readonly expandable: boolean;

    constructor(content: ContentSummary, selectable: boolean = true, expandable: boolean = true) {
        this.content = content;
        this.selectable = selectable;
        this.expandable = expandable;
    }

    getIconClass(): string {
        return '';
    }

    public static fromJson(json: ContentTreeSelectorItemJson) {
        return new ContentTreeSelectorItem(ContentSummary.fromJson(json.content), json.selectable, json.expandable);
    }

    public static from(content: ContentSummary, selectable: boolean, expandable: boolean) {
        return new ContentTreeSelectorItem(content, selectable, expandable);
    }

    getContent(): ContentSummary {
        return this.content;
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
        return this.content ? this.content.getName() : null;
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
        return this.content ? this.content.isImage() : null;
    }

    isSite(): boolean {
        return this.content ? this.content.isSite() : null;
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

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ClassHelper.getClass(this))) {
            return false;
        }

        let other = o as ContentTreeSelectorItem;

        if (!ObjectHelper.equals(this.content, other.content)) {
            return false;
        }

        if (this.selectable !== other.selectable) {
            return false;
        }

        return this.expandable === other.expandable;
    }

}
