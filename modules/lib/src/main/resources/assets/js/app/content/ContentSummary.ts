import {Thumbnail} from '@enonic/lib-admin-ui/thumb/Thumbnail';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ContentSummaryJson} from './ContentSummaryJson';
import {ContentName} from './ContentName';
import {ContentPath} from './ContentPath';
import {assert} from '@enonic/lib-admin-ui/util/Assert';
import {ContentUnnamed} from './ContentUnnamed';
import {ContentInheritType} from './ContentInheritType';
import {ContentId} from './ContentId';
import {ChildOrder} from '../resource/order/ChildOrder';
import {WorkflowState} from './WorkflowState';
import {Workflow} from './Workflow';
import {ContentSummaryHelper} from './ContentSummaryHelper';
import {isEqual} from '../Diff';

export class ContentSummary {

    private readonly id: string;

    private readonly contentId: ContentId;

    private readonly name: ContentName;

    private readonly displayName: string;

    private readonly path: ContentPath;

    private readonly children: boolean;

    private readonly type: ContentTypeName;

    private readonly iconUrl: string;

    private readonly thumbnail: Thumbnail;

    private readonly modifier: PrincipalKey;

    private readonly owner: PrincipalKey;

    private readonly page: boolean;

    private readonly valid: boolean;

    private readonly requireValid: boolean;

    private readonly createdTime: Date;

    private readonly creator: PrincipalKey;

    private readonly modifiedTime: Date;

    private readonly archivedTime: Date;

    private readonly publishFirstTime: Date;

    private readonly publishFromTime: Date;

    private readonly publishToTime: Date;

    private readonly deletable: boolean;

    private readonly editable: boolean;

    private readonly childOrder: ChildOrder;

    private readonly language: string;

    private readonly workflow: Workflow;

    private readonly inherit: ContentInheritType[];

    private readonly originProject: string;

    private readonly listTitle: string;

    private readonly originalParentPath: string;

    private readonly originalName: string;

    private readonly archivedBy: PrincipalKey;

    private readonly variantOf: string;

    private readOnly: boolean;

    constructor(builder: ContentSummaryBuilder) {
        this.name = builder.name;
        this.displayName = builder.displayName;
        this.path = builder.path;
        this.children = builder.children;
        this.type = builder.type;
        this.iconUrl = builder.iconUrl;
        this.thumbnail = builder.thumbnail;
        this.modifier = builder.modifier;
        this.creator = builder.creator;
        this.owner = builder.owner;
        this.page = builder.page;
        this.valid = builder.valid;
        this.requireValid = builder.requireValid;

        this.id = builder.id;
        this.contentId = builder.contentId;
        this.createdTime = builder.createdTime;
        this.modifiedTime = builder.modifiedTime;
        this.archivedTime = builder.archivedTime;
        this.archivedBy = builder.archivedBy;
        this.publishFromTime = builder.publishFromTime;
        this.publishToTime = builder.publishToTime;
        this.publishFirstTime = builder.publishFirstTime;
        this.deletable = builder.deletable;
        this.editable = builder.editable;
        this.childOrder = builder.childOrder;
        this.language = builder.language;
        this.workflow = builder.workflow;
        this.inherit = builder.inherit;
        this.originProject = builder.originProject;
        this.listTitle = builder.listTitle;
        this.originalParentPath = builder.originalParentPath;
        this.originalName = builder.originalName;
        this.variantOf = builder.variantOf;
        this.readOnly = builder.readOnly;
    }

    static fromJson(json: ContentSummaryJson): ContentSummary {
        return new ContentSummaryBuilder().fromContentSummaryJson(json).build();
    }

    static fromJsonArray(jsonArray: ContentSummaryJson[]): ContentSummary[] {
        return jsonArray.map((json: ContentSummaryJson) => ContentSummary.fromJson(json));
    }

    getName(): ContentName {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    hasParent(): boolean {
        return this.path.hasParentContent();
    }

    getPath(): ContentPath {
        return this.path;
    }

    hasChildren(): boolean {
        return this.children;
    }

    getType(): ContentTypeName {
        return this.type;
    }

    getIconUrl(): string {
        return this.iconUrl;
    }

    hasThumbnail(): boolean {
        return !!this.thumbnail;
    }

    getThumbnail(): Thumbnail {
        return this.thumbnail;
    }

    getOwner(): PrincipalKey {
        return this.owner;
    }

    getModifier(): PrincipalKey {
        return this.modifier;
    }

    isSite(): boolean {
        return this.type.isSite();
    }

    isPage(): boolean {
        return this.page;
    }

    isPageTemplate(): boolean {
        return this.type.isPageTemplate();
    }

    isImage(): boolean {
        return this.type.isImage();
    }

    isValid(): boolean {
        return this.valid;
    }

    isRequireValid(): boolean {
        return this.requireValid;
    }

    getId(): string {
        return this.id;
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    getCreatedTime(): Date {
        return this.createdTime;
    }

    getModifiedTime(): Date {
        return this.modifiedTime;
    }

    getArchivedTime(): Date {
        return this.archivedTime;
    }

    getArchivedBy(): PrincipalKey {
        return this.archivedBy;
    }

    getPublishFirstTime(): Date {
        return this.publishFirstTime;
    }

    getPublishFromTime(): Date {
        return this.publishFromTime;
    }

    getPublishToTime(): Date {
        return this.publishToTime;
    }

    isDeletable(): boolean {
        return this.deletable;
    }

    isEditable(): boolean {
        return this.editable;
    }

    getChildOrder(): ChildOrder {
        return this.childOrder;
    }

    getLanguage(): string {
        return this.language;
    }

    getWorkflow(): Workflow {
        return this.workflow;
    }

    isReady(): boolean {
        return !!this.workflow && this.workflow.getState() === WorkflowState.READY;
    }

    isInProgress(): boolean {
        return !!this.workflow && this.workflow.getState() === WorkflowState.IN_PROGRESS;
    }

    getInherit(): ContentInheritType[] {
        return this.inherit;
    }

    isInherited(): boolean {
        return this.inherit && this.inherit.length > 0;
    }

    isDataInherited(): boolean {
        return this.isInheritedByType(ContentInheritType.CONTENT);
    }

    isSortInherited(): boolean {
        return this.isInheritedByType(ContentInheritType.SORT);
    }

    isParentInherited(): boolean {
      return this.isInheritedByType(ContentInheritType.PARENT);
    }

    isNameInherited(): boolean {
      return this.isInheritedByType(ContentInheritType.NAME);
    }

    getOriginProject(): string {
        return this.originProject;
    }

    getListTitle(): string {
        return this.listTitle;
    }

    getOriginalParentPath(): string {
        return this.originalParentPath;
    }

    getOriginalName(): string {
        return this.originalName;
    }

    getVariantOf(): string {
        return this.variantOf;
    }

    isVariant(): boolean {
        return !!this.variantOf;
    }

    setReadOnly(value: boolean) {
        this.readOnly = value;
    }

    isReadOnly(): boolean {
        return !!this.readOnly;
    }

    getCreator(): PrincipalKey {
        return this.creator;
    }

    private isInheritedByType(type: ContentInheritType): boolean {
        return this.isInherited() && this.inherit.some((inheritType: ContentInheritType) => inheritType === type);
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentSummary)) {
            return false;
        }

        const diff = ContentSummaryHelper.diff(this, o as ContentSummary);
        return isEqual(diff);
    }
}

export class ContentSummaryBuilder {

    id: string;

    contentId: ContentId;

    name: ContentName;

    displayName: string;

    path: ContentPath;

    children: boolean;

    type: ContentTypeName;

    iconUrl: string;

    thumbnail: Thumbnail;

    modifier: PrincipalKey;

    owner: PrincipalKey;

    page: boolean;

    valid: boolean;

    requireValid: boolean;

    createdTime: Date;

    creator: PrincipalKey;

    modifiedTime: Date;

    archivedTime: Date;

    publishFirstTime: Date;

    publishFromTime: Date;

    publishToTime: Date;

    deletable: boolean;

    editable: boolean;

    childOrder: ChildOrder;

    language: string;

    workflow: Workflow;

    inherit: ContentInheritType[];

    originProject: string;

    listTitle: string;

    originalParentPath: string;

    originalName: string;

    archivedBy: PrincipalKey;

    variantOf: string;

    readOnly: boolean;

    constructor(source?: ContentSummary) {
        if (source) {
            this.id = source.getId();
            this.contentId = source.getContentId();
            this.name = source.getName();
            this.displayName = source.getDisplayName();
            this.path = source.getPath();
            this.children = source.hasChildren();
            this.type = source.getType();
            this.iconUrl = source.getIconUrl();
            this.thumbnail = source.getThumbnail();
            this.modifier = source.getModifier();
            this.owner = source.getOwner();
            this.page = source.isPage();
            this.valid = source.isValid();
            this.requireValid = source.isRequireValid();
            this.createdTime = source.getCreatedTime();
            this.modifiedTime = source.getModifiedTime();
            this.archivedTime = source.getArchivedTime();
            this.archivedBy = source.getArchivedBy();
            this.publishFromTime = source.getPublishFromTime();
            this.publishToTime = source.getPublishToTime();
            this.publishFirstTime = source.getPublishFirstTime();
            this.deletable = source.isDeletable();
            this.editable = source.isEditable();
            this.childOrder = source.getChildOrder();
            this.language = source.getLanguage();
            this.workflow = source.getWorkflow();
            this.inherit = source.getInherit();
            this.originProject = source.getOriginProject();
            this.listTitle = source.getListTitle();
            this.originalParentPath = source.getOriginalParentPath();
            this.originalName = source.getOriginalName();
            this.variantOf = source.getVariantOf();
            this.readOnly = source.isReadOnly();
            this.creator = source.getCreator();
        }
    }

    fromContentSummaryJson(json: ContentSummaryJson): ContentSummaryBuilder {
        this.name = ContentSummaryBuilder.createName(json.name);
        this.displayName = json.displayName;
        this.path = ContentPath.create().fromString(json.path).build();
        this.children = json.hasChildren;
        this.type = new ContentTypeName(json.type);
        this.iconUrl = json.iconUrl;
        this.thumbnail = json.thumbnail ? Thumbnail.create().fromJson(json.thumbnail).build() : null;
        this.modifier = json.modifier ? PrincipalKey.fromString(json.modifier) : null;
        this.owner = json.owner ? PrincipalKey.fromString(json.owner) : null;
        this.page = json.isPage;
        this.valid = json.isValid;
        this.requireValid = json.requireValid;
        this.language = json.language;
        this.id = json.id;

        this.contentId = new ContentId(json.id);
        this.creator = json.creator ? PrincipalKey.fromString(json.creator) : null;
        this.createdTime = json.createdTime ? new Date(Date.parse(json.createdTime)) : null;
        this.modifiedTime = json.modifiedTime ? new Date(Date.parse(json.modifiedTime)) : null;
        this.archivedTime = json.archivedTime ? new Date(Date.parse(json.archivedTime)) : null;
        this.archivedBy = json.archivedBy ? PrincipalKey.fromString(json.archivedBy) : null;
        this.publishFirstTime = json.publish && json.publish.first ? new Date(Date.parse(json.publish.first)) : null;
        this.publishFromTime = json.publish && json.publish.from ? new Date(Date.parse(json.publish.from)) : null;
        this.publishToTime = json.publish && json.publish.to ? new Date(Date.parse(json.publish.to)) : null;

        this.deletable = json.deletable;
        this.editable = json.editable;

        this.childOrder = ChildOrder.fromJson(json.childOrder);
        this.workflow = Workflow.fromJson(json.workflow);
        this.inherit = json.inherit && json.inherit.length > 0 ? json.inherit.map((type: string) => ContentInheritType[type])  : [];
        this.originProject = json.originProject;
        this.listTitle = ObjectHelper.isDefined(json.listTitle) ? json.listTitle : json.displayName;

        this.originalParentPath = json.originalParentPath;
        this.originalName = json.originalName;
        this.variantOf = json.variantOf;

        return this;
    }

    private static createName(name: string) {
        assert(name != null, 'name cannot be null');
        if (name.indexOf(ContentUnnamed.UNNAMED_PREFIX) === 0) {
            return new ContentUnnamed(name);
        } else {
            return new ContentName(name);
        }
    }

    setId(value: string): ContentSummaryBuilder {
        this.id = value;
        return this;
    }

    setContentId(value: ContentId): ContentSummaryBuilder {
        this.contentId = value;
        return this;
    }

    setIconUrl(value: string): ContentSummaryBuilder {
        this.iconUrl = value;
        return this;
    }

    setValid(value: boolean): ContentSummaryBuilder {
        this.valid = value;
        return this;
    }

    setRequireValid(value: boolean): ContentSummaryBuilder {
        this.valid = value;
        return this;
    }

    setName(value: ContentName): ContentSummaryBuilder {
        this.name = value;
        return this;
    }

    setPath(path: ContentPath): ContentSummaryBuilder {
        this.path = path;
        return this;
    }

    setType(value: ContentTypeName): ContentSummaryBuilder {
        this.type = value;
        return this;
    }

    setDisplayName(value: string): ContentSummaryBuilder {
        this.displayName = value;
        return this;
    }

    setHasChildren(value: boolean): ContentSummaryBuilder {
        this.children = value;
        return this;
    }

    setDeletable(value: boolean): ContentSummaryBuilder {
        this.deletable = value;
        return this;
    }

    setPublishFromTime(value: Date): ContentSummaryBuilder {
        this.publishFromTime = value;
        return this;
    }

    setPublishToTime(value: Date): ContentSummaryBuilder {
        this.publishToTime = value;
        return this;
    }

    setPublishFirstTime(value: Date): ContentSummaryBuilder {
        this.publishFirstTime = value;
        return this;
    }

    setWorkflow(value: Workflow): ContentSummaryBuilder {
        this.workflow = value;
        return this;
    }

    setInherit(value: ContentInheritType[]): ContentSummaryBuilder {
        this.inherit = value;
        return this;
    }

    setOriginProject(value: string): ContentSummaryBuilder {
        this.originProject = value;
        return this;
    }

    setOriginalParentPath(value: string): ContentSummaryBuilder {
        this.originalParentPath = value;
        return this;
    }

    setOriginalName(value: string): ContentSummaryBuilder {
        this.originalName = value;
        return this;
    }

    setModifier(value: PrincipalKey): ContentSummaryBuilder {
        this.modifier = value;
        return this;
    }

    setCreator(value: PrincipalKey): ContentSummaryBuilder {
        this.creator = value;
        return this;
    }

    build(): ContentSummary {
        return new ContentSummary(this);
    }
}
