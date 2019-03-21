import Property = api.data.Property;
import PropertyTree = api.data.PropertyTree;
import RoleKeys = api.security.RoleKeys;
import ContentSummary = api.content.ContentSummary;
import ContentSummaryBuilder = api.content.ContentSummaryBuilder;
import {Attachments, AttachmentsBuilder} from '../attachment/Attachments';
import {ContentJson} from './ContentJson';
import {ExtraData} from './ExtraData';
import {ExtraDataByMixinNameComparator} from './ExtraDataByMixinNameComparator';
import {ExtraDataJson} from '../resource/json/ExtraDataJson';
import {XDataName} from './XDataName';
import {Page, PageBuilder} from '../page/Page';
import {AccessControlList} from '../access/AccessControlList';
import {Permission} from '../access/Permission';
import {PropertyTreeHelper} from '../util/PropertyTreeHelper';

export class Content
    extends ContentSummary
    implements api.Equitable, api.Cloneable {

    private data: PropertyTree;

    private attachments: Attachments;

    private extraData: ExtraData[] = [];

    private pageObj: Page;

    private permissions: AccessControlList;

    private inheritPermissions: boolean;

    private overwritePermissions: boolean;

    constructor(builder: ContentBuilder) {
        super(builder);

        api.util.assertNotNull(builder.data, 'data is required for Content');
        this.data = builder.data;
        this.attachments = builder.attachments;
        this.extraData = builder.extraData || [];
        this.pageObj = builder.pageObj;
        this.permissions = builder.permissions || new AccessControlList();
        this.inheritPermissions = builder.inheritPermissions;
        this.overwritePermissions = builder.overwritePermissions;
    }

    getContentData(): PropertyTree {
        return this.data;
    }

    getAttachments(): Attachments {
        return this.attachments;
    }

    getExtraData(name: XDataName): ExtraData {
        return this.extraData.filter((item: ExtraData) => item.getName().equals(name))[0];
    }

    getAllExtraData(): ExtraData[] {
        return this.extraData;
    }

    getProperty(propertyName: string): Property {
        return propertyName ? this.data.getProperty(propertyName) : null;
    }

    getPage(): Page {
        return this.pageObj;
    }

    getPermissions(): AccessControlList {
        return this.permissions;
    }

    isInheritPermissionsEnabled(): boolean {
        return this.inheritPermissions;
    }

    isOverwritePermissionsEnabled(): boolean {
        return this.overwritePermissions;
    }

    isAnyPrincipalAllowed(principalKeys: api.security.PrincipalKey[], permission: Permission): boolean {

        if (principalKeys.some(key => RoleKeys.isAdmin(key))) {
            return true;
        }

        for (let i = 0; i < this.permissions.getEntries().length; i++) {
            let entry = this.permissions.getEntries()[i];

            if (entry.isAllowed(permission)) {
                let principalInEntry = principalKeys.some((principalKey: api.security.PrincipalKey) => {
                    if (principalKey.equals(entry.getPrincipalKey())) {
                        return true;
                    }
                });
                if (principalInEntry) {
                    return true;
                }
            }
        }
        return false;
    }

    private dataEquals(other: PropertyTree, ignoreEmptyValues: boolean = false): boolean {
        let data: PropertyTree;
        let otherData: PropertyTree;
        if (ignoreEmptyValues) {
            data = PropertyTreeHelper.trimPropertyTree(this.data);
            otherData = PropertyTreeHelper.trimPropertyTree(other);
        } else {
            data = this.data;
            otherData = other;
        }
        return api.ObjectHelper.equals(data, otherData);
    }

    private extraDataEquals(other: ExtraData[]): boolean {
        const comparator = new ExtraDataByMixinNameComparator();

        return api.ObjectHelper.arrayEquals(this.extraData.sort(comparator.compare), other.sort(comparator.compare));
    }

    equals(o: api.Equitable, ignoreEmptyValues: boolean = false): boolean {
        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, Content)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = <Content>o;

        if (!this.dataEquals(other.getContentData(), ignoreEmptyValues)) {
            return false;
        }

        if (!this.extraDataEquals(other.getAllExtraData())) {
            return false;
        }

        if (!api.ObjectHelper.equals(this.pageObj, other.pageObj)) {
            return false;
        }

        if (!api.ObjectHelper.equals(this.permissions, other.permissions)) {
            return false;
        }

        if (!api.ObjectHelper.equals(this.attachments, other.attachments)) {
            return false;
        }

        if (this.inheritPermissions !== other.inheritPermissions) {
            return false;
        }

        return true;
    }

    clone(): Content {
        return this.newBuilder().build();
    }

    newBuilder(): ContentBuilder {
        return new ContentBuilder(this);
    }
}

export class ContentBuilder
    extends ContentSummaryBuilder {

    data: PropertyTree;

    attachments: Attachments;

    extraData: ExtraData[];

    pageObj: Page;

    permissions: AccessControlList;

    inheritPermissions: boolean = true;

    overwritePermissions: boolean = false;

    constructor(source?: Content) {
        super(source);
        if (source) {

            this.data = source.getContentData() ? source.getContentData().copy() : null;
            this.attachments = source.getAttachments();
            this.extraData = source.getAllExtraData() ? source.getAllExtraData().map((extraData: ExtraData) => extraData.clone()) : [];
            this.pageObj = source.getPage() ? source.getPage().clone() : null;
            this.permissions = source.getPermissions(); // TODO clone?
            this.inheritPermissions = source.isInheritPermissionsEnabled();
            this.overwritePermissions = source.isOverwritePermissionsEnabled();
        }
    }

    fromContentJson(json: ContentJson): ContentBuilder {

        super.fromContentSummaryJson(json);

        this.data = PropertyTree.fromJson(json.data);
        this.attachments = new AttachmentsBuilder().fromJson(json.attachments).build();
        this.extraData = [];
        json.meta.forEach((extraDataJson: ExtraDataJson) => {
            this.extraData.push(ExtraData.fromJson(extraDataJson));
        });

        if (this.page) {
            this.pageObj = new PageBuilder().fromJson(json.page).build();
            this.page = true;
        }
        if (json.permissions) {
            this.permissions = AccessControlList.fromJson(json);
        }
        if (typeof json.inheritPermissions !== 'undefined') {
            this.inheritPermissions = json.inheritPermissions;
        }

        this.overwritePermissions = false;

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

    setExtraData(extraData: ExtraData[]): ContentBuilder {
        this.extraData = extraData;
        return this;
    }

    setPermissions(value: AccessControlList): ContentBuilder {
        this.permissions = value;
        return this;
    }

    setInheritPermissionsEnabled(value: boolean): ContentBuilder {
        this.inheritPermissions = value;
        return this;
    }

    setOverwritePermissionsEnabled(value: boolean): ContentBuilder {
        this.overwritePermissions = value;
        return this;
    }

    build(): Content {
        return new Content(this);
    }
}
