import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ContentState} from 'lib-admin-ui/schema/content/ContentState';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentName} from 'lib-admin-ui/content/ContentName';

export class ContentTreeSelectorItemJson {

    content: ContentSummaryJson;

    selectable: boolean;

    expandable: boolean;
}

export class ContentTreeSelectorItem
    implements Equitable {

    private content: ContentSummary;

    private selectable: boolean;

    private expandable: boolean;

    constructor(content: ContentSummary, selectable: boolean = true, expandable: boolean = true) {
        this.content = content;
        this.selectable = selectable;
        this.expandable = expandable;
    }

    public static fromJson(json: ContentTreeSelectorItemJson) {
        return new ContentTreeSelectorItem(ContentSummary.fromJson(json.content), json.selectable, json.expandable);
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

    getContentState(): ContentState {
        return this.content ? this.content.getContentState() : null;
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

        let other = <ContentTreeSelectorItem>o;

        if (!ObjectHelper.equals(this.content, other.content)) {
            return false;
        }

        if (this.selectable !== other.selectable) {
            return false;
        }

        if (this.expandable !== other.expandable) {
            return false;
        }

        return true;
    }

}
