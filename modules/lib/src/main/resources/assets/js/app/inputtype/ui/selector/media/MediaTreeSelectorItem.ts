import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {ContentIconUrlResolver} from '../../../../content/ContentIconUrlResolver';
import {ContentSummary} from '../../../../content/ContentSummary';
import {ContentTreeSelectorItem, ContentTreeSelectorItemBuilder} from '../../../../item/ContentTreeSelectorItem';

export class MediaTreeSelectorItem
    extends ContentTreeSelectorItem {

    private readonly uploadItem?: UploadItem<ContentSummary>;

    constructor(builder: MediaTreeSelectorItemBuilder) {
        super(builder);

        this.uploadItem = builder.uploadItem;
    }

    static fromContentTreeSelectorItem(item: ContentTreeSelectorItem): MediaTreeSelectorItem {
        return MediaTreeSelectorItem.create().setContent(item.getContent()).setSelectable(item.isSelectable()).setExpandable(item.isExpandable()).setAvailabilityStatus(item.getAvailabilityStatus()).build();
    }

    getImageUrl(): string {
        return this.isAvailable() ? new ContentIconUrlResolver().setContent(this.getContentSummary()).resolve() : null;
    }

    getTypeLocaleName(): string {
        return this.getContent().getType()?.getLocalName()
    }

    getId(): string {
        return this.uploadItem ? this.uploadItem.getId() : this.getContent().getId();
    }


    getDisplayName(): string {
        return this.uploadItem ? this.uploadItem.getFileName() : super.getDisplayName();
    }

    getUploadItem(): UploadItem<ContentSummary> {
        return this.uploadItem;
    }

    static create(): MediaTreeSelectorItemBuilder {
        return new MediaTreeSelectorItemBuilder();
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ClassHelper.getClass(this))) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        const other = o as MediaTreeSelectorItem;

        return ObjectHelper.equals(this.uploadItem, other.getUploadItem());
    }
}

export class MediaTreeSelectorItemBuilder extends ContentTreeSelectorItemBuilder {
    uploadItem: UploadItem<ContentSummary>;

    setUploadItem(uploadItem: UploadItem<ContentSummary>): this {
        this.uploadItem = uploadItem;
        return this;
    }

    build(): MediaTreeSelectorItem {
        return new MediaTreeSelectorItem(this);
    }

}
