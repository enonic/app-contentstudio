import ContentSummary = api.content.ContentSummary;
import ObjectHelper = api.ObjectHelper;
import {MediaSelectorDisplayValue} from './MediaSelectorDisplayValue';
import {ContentTreeSelectorItem} from '../../../../item/ContentTreeSelectorItem';

export class MediaTreeSelectorItem
    extends ContentTreeSelectorItem {

    private mediaSelectorDisplayValue: MediaSelectorDisplayValue;

    constructor(content: ContentSummary, selectable?: boolean, expandable?: boolean) {
        super(content, selectable, expandable);
        this.mediaSelectorDisplayValue =
            content ? MediaSelectorDisplayValue.fromContentSummary(content) : MediaSelectorDisplayValue.makeEmpty();
    }

    setDisplayValue(value: MediaSelectorDisplayValue): MediaTreeSelectorItem {
        this.mediaSelectorDisplayValue = value;
        return this;
    }

    getDisplayValue(): MediaSelectorDisplayValue {
        return this.mediaSelectorDisplayValue;
    }

    getImageUrl(): string {
        return this.mediaSelectorDisplayValue.getImageUrl();
    }

    isEmptyContent(): boolean {
        return this.mediaSelectorDisplayValue.isEmptyContent();
    }

    getContentSummary(): ContentSummary {
        return this.mediaSelectorDisplayValue.getContentSummary();
    }

    getTypeLocaleName(): string {
        return this.mediaSelectorDisplayValue.getTypeLocaleName();
    }

    getId(): string {
        return this.mediaSelectorDisplayValue.getId();
    }

    getContentId(): api.content.ContentId {
        return this.mediaSelectorDisplayValue.getContentId();
    }

    getContentPath(): api.content.ContentPath {
        return this.mediaSelectorDisplayValue.getContentPath();
    }

    getPath(): api.content.ContentPath {
        return this.mediaSelectorDisplayValue.getPath();
    }

    getDisplayName(): string {
        return this.mediaSelectorDisplayValue.getDisplayName();
    }

    equals(o: api.Equitable): boolean {

        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, api.ClassHelper.getClass(this))) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = <MediaTreeSelectorItem>o;

        if (!ObjectHelper.equals(this.mediaSelectorDisplayValue, other.getDisplayValue())) {
            return false;
        }

        return true;
    }
}
