import {Property} from '@enonic/lib-admin-ui/data/Property';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {Attachments, AttachmentsBuilder} from '../attachment/Attachments';
import {ContentJson} from './ContentJson';
import {Mixin} from './Mixin';
import {MixinJson} from '../resource/json/MixinJson';
import {MixinName} from './MixinName';
import {Page, PageBuilder} from '../page/Page';
import {AccessControlList} from '../access/AccessControlList';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ContentSummary, ContentSummaryBuilder} from './ContentSummary';
import {ValidationError} from '@enonic/lib-admin-ui/ValidationError';
import {ContentDiff} from './ContentDiff';
import {isEqual} from '../Diff';
import {ContentDiffHelper} from '../util/ContentDiffHelper';

export class Content
    extends ContentSummary
    implements Equitable, Cloneable {

    private readonly data: PropertyTree;

    private readonly attachments: Attachments;

    private readonly mixins: Mixin[] = [];

    private readonly pageObj: Page;

    private readonly permissions: AccessControlList;

    private readonly validationErrors: ValidationError[] = [];

    constructor(builder: ContentBuilder) {
        super(builder);

        assertNotNull(builder.data, 'data is required for Content');
        this.data = builder.data;
        this.attachments = builder.attachments;
        this.mixins = builder.mixins || [];
        this.pageObj = builder.pageObj;
        this.permissions = builder.permissions || new AccessControlList();
        this.validationErrors = builder.validationErrors || [];
    }

    getContentData(): PropertyTree {
        return this.data;
    }

    getAttachments(): Attachments {
        return this.attachments;
    }

    getMixinByName(name: MixinName): Mixin {
        return this.mixins.filter((item: Mixin) => item.getName().equals(name))[0];
    }

    getMixins(): Mixin[] {
        return this.mixins;
    }

    getProperty(propertyName: string): Property {
        return propertyName ? this.data.getProperty(propertyName) : null;
    }

    getPage(): Page {
        return this.pageObj;
    }

    getValidationErrors(): ValidationError[] {
        return this.validationErrors;
    }

    getPermissions(): AccessControlList {
        return this.permissions;
    }

    equals(o: Equitable, ignoreEmptyValues: boolean = false): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, Content)) {
            return false;
        }

        const diff: ContentDiff = ContentDiffHelper.diff(this, o as Content, ignoreEmptyValues);
        return isEqual(diff);
    }

    clone(): Content {
        return this.newBuilder().build();
    }

    newBuilder(): ContentBuilder {
        return new ContentBuilder(this);
    }

    newBuilderWithoutProperties(): ContentBuilder {
        return new ContentBuilder(this, false);
    }
}

export class ContentBuilder
    extends ContentSummaryBuilder {

    data: PropertyTree;

    attachments: Attachments;

    mixins: Mixin[];

    pageObj: Page;

    permissions: AccessControlList;

    validationErrors: ValidationError[];

    constructor(source?: Content, cloneProperties: boolean = true) {
        super(source);

        if (source) {
            if (cloneProperties) {
                this.data = source.getContentData() ? source.getContentData().copy() : null;
                this.mixins = source.getMixins() ? source.getMixins().map((mixin: Mixin) => mixin.clone()) : [];
                this.pageObj = source.getPage() ? source.getPage().clone() : null;
            }
            this.attachments = source.getAttachments();
            this.permissions = source.getPermissions(); // TODO clone?
            this.validationErrors = source.getValidationErrors();
        }
    }

    fromContentJson(json: ContentJson): this {

        super.fromContentSummaryJson(json);

        this.data = PropertyTree.fromJson(json.data);
        this.attachments = new AttachmentsBuilder().fromJson(json.attachments).build();
        this.mixins = [];
        json.meta.forEach((mixinJson: MixinJson) => {
            this.mixins.push(Mixin.fromJson(mixinJson));
        });

        if (this.page) {
            this.pageObj = new PageBuilder().fromJson(json.page).build();
            this.page = true;
        }

        if (json.permissions) {
            this.permissions = AccessControlList.fromJson(json);
        }

        if (json.validationErrors) {
            this.validationErrors = json.validationErrors.map(ValidationError.fromJson);
        }

        return this;
    }

    setData(value: PropertyTree): ContentBuilder {
        this.data = value;
        return this;
    }

    setAttachments(value: Attachments): ContentBuilder {
        this.attachments = value;
        return this;
    }

    setPage(value: Page): ContentBuilder {
        this.pageObj = value;
        this.page = !!value;
        return this;
    }

    setMixins(mixins: Mixin[]): ContentBuilder {
        this.mixins = mixins;
        return this;
    }

    setPermissions(value: AccessControlList): ContentBuilder {
        this.permissions = value;
        return this;
    }

    setValidationErrors(value: ValidationError[]): ContentBuilder {
        this.validationErrors = value;
        return this;
    }

    build(): Content {
        return new Content(this);
    }
}
