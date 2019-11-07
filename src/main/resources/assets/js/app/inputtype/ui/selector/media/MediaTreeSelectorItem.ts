import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
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

    getContentId(): ContentId {
        return this.mediaSelectorDisplayValue.getContentId();
    }

    getContentPath(): ContentPath {
        return this.mediaSelectorDisplayValue.getContentPath();
    }

    getPath(): ContentPath {
        return this.mediaSelectorDisplayValue.getPath();
    }

    getDisplayName(): string {
        return this.mediaSelectorDisplayValue.getDisplayName();
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ClassHelper.getClass(this))) {
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
