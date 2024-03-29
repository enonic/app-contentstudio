import {Property} from '@enonic/lib-admin-ui/data/Property';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {PropertyTreeHelper} from '@enonic/lib-admin-ui/util/PropertyTreeHelper';
import {Attachments, AttachmentsBuilder} from '../attachment/Attachments';
import {ContentJson} from './ContentJson';
import {ExtraData} from './ExtraData';
import {ExtraDataByMixinNameComparator} from './ExtraDataByMixinNameComparator';
import {ExtraDataJson} from '../resource/json/ExtraDataJson';
import {XDataName} from './XDataName';
import {Page, PageBuilder} from '../page/Page';
import {AccessControlList} from '../access/AccessControlList';
import {Permission} from '../access/Permission';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ContentSummary, ContentSummaryBuilder} from './ContentSummary';
import {ValidationError} from '@enonic/lib-admin-ui/ValidationError';

export class Content
    extends ContentSummary
    implements Equitable, Cloneable {

    private readonly data: PropertyTree;

    private readonly attachments: Attachments;

    private readonly extraData: ExtraData[] = [];

    private readonly pageObj: Page;

    private readonly permissions: AccessControlList;

    private readonly inheritPermissions: boolean;

    private readonly overwritePermissions: boolean;

    private readonly validationErrors: ValidationError[] = [];

    constructor(builder: ContentBuilder) {
        super(builder);

        assertNotNull(builder.data, 'data is required for Content');
        this.data = builder.data;
        this.attachments = builder.attachments;
        this.extraData = builder.extraData || [];
        this.pageObj = builder.pageObj;
        this.permissions = builder.permissions || new AccessControlList();
        this.inheritPermissions = builder.inheritPermissions;
        this.overwritePermissions = builder.overwritePermissions;
        this.validationErrors = builder.validationErrors || [];
    }

    getContentData(): PropertyTree {
        return this.data;
    }

    getAttachments(): Attachments {
        return this.attachments;
    }

    getExtraDataByNameString(name: string): ExtraData {
        return this.extraData.find((item: ExtraData) => item.getName().toString() === name);
    }

    getExtraDataByName(name: XDataName): ExtraData {
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

    getValidationErrors(): ValidationError[] {
        return this.validationErrors;
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

    isAnyPrincipalAllowed(principalKeys: PrincipalKey[], permission: Permission): boolean {

        if (principalKeys.some(key => RoleKeys.isAdmin(key))) {
            return true;
        }
        const permissionEntries = this.permissions.getEntries();
        for (const permissionEntry of permissionEntries) {
            if (permissionEntry.isAllowed(permission)) {
                const principalInEntry = principalKeys.some((principalKey: PrincipalKey) => {
                    if (principalKey.equals(permissionEntry.getPrincipalKey())) {
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

    dataEquals(other: PropertyTree, ignoreEmptyValues: boolean = false): boolean {
        return PropertyTreeHelper.propertyTreesEqual(this.data, other, ignoreEmptyValues);
    }

    extraDataEquals(other: ExtraData[], ignoreEmptyValues: boolean = false): boolean {
        if (ignoreEmptyValues) {
            const isOtherArrayEmpty: boolean = !other || other.length === 0 || other.every(ed => !ed.getData() || ed.getData().isEmpty());
            const isThisArrayEmpty: boolean =
                !this.extraData || this.extraData.length === 0 || this.extraData.every(ed => !ed.getData() || ed.getData().isEmpty());

            if (isThisArrayEmpty && isOtherArrayEmpty) {
                return true;
            }
        }

        const comparator = new ExtraDataByMixinNameComparator();

        const arrayA = this.extraData.sort(comparator.compare);
        const arrayB = other.sort(comparator.compare);

        if (arrayA.length !== arrayB.length) {
            return false;
        }

        for (let i = 0; i < arrayA.length; i++) {
            if (!PropertyTreeHelper.propertyTreesEqual(arrayA[i].getData(), arrayB[i].getData(), ignoreEmptyValues)) {
                return false;
            }
        }

        return true;
    }

    equals(o: Equitable, ignoreEmptyValues: boolean = false): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, Content)) {
            return false;
        }

        if (!super.equals(o)) {
            return false;
        }

        let other = o as Content;

        if (!this.dataEquals(other.getContentData(), ignoreEmptyValues)) {
            return false;
        }

        if (!this.extraDataEquals(other.getAllExtraData(), ignoreEmptyValues)) {
            return false;
        }

        if (!ObjectHelper.equals(this.pageObj, other.pageObj)) {
            return false;
        }

        if (!ObjectHelper.equals(this.permissions, other.permissions)) {
            return false;
        }

        if (!ObjectHelper.equals(this.attachments, other.attachments)) {
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

    newBuilderWithoutProperties(): ContentBuilder {
        return new ContentBuilder(this, false);
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

    validationErrors: ValidationError[];

    constructor(source?: Content, cloneProperties: boolean = true) {
        super(source);

        if (source) {
            if (cloneProperties) {
                this.data = source.getContentData() ? source.getContentData().copy() : null;
                this.extraData = source.getAllExtraData() ? source.getAllExtraData().map((extraData: ExtraData) => extraData.clone()) : [];
                this.pageObj = source.getPage() ? source.getPage().clone() : null;
            }
            this.attachments = source.getAttachments();
            this.permissions = source.getPermissions(); // TODO clone?
            this.inheritPermissions = source.isInheritPermissionsEnabled();
            this.overwritePermissions = source.isOverwritePermissionsEnabled();
            this.validationErrors = source.getValidationErrors();
        }
    }

    fromContentJson(json: ContentJson): this {

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

        if (json.validationErrors) {
            this.validationErrors = json.validationErrors.map(ValidationError.fromJson);
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

    setValidationErrors(value: ValidationError[]): ContentBuilder {
        this.validationErrors = value;
        return this;
    }

    build(): Content {
        return new Content(this);
    }
}
