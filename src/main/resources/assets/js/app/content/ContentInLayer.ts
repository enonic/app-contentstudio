import {Attachment, AttachmentBuilder} from '../attachment/Attachment';
import {ContentInLayerJson} from '../resource/json/ContentInLayerJson';
import {CompareContentResult} from '../resource/CompareContentResult';
import Workflow = api.content.Workflow;

export class ContentInLayer
    implements api.Equitable {

    private id: string;

    private path: string;

    private name: string;

    private displayName: string;

    private language: string;

    private layerLanguage: string;

    private status: CompareContentResult;

    private publishFirstTime: Date;

    private inherited: boolean;

    private layer: string;

    private parentLayer: string;

    private layerDisplayName: string;

    private icon: Attachment;

    private workflow: Workflow;

    constructor(builder: ContentInLayerBuilder) {
        this.id = builder.id;
        this.path = builder.path;
        this.name = builder.name;
        this.displayName = builder.displayName;
        this.language = builder.language;
        this.layerLanguage = builder.layerLanguage;
        this.status = builder.status;
        this.publishFirstTime = builder.publishFirstTime;
        this.inherited = builder.inherited;
        this.layer = builder.layer;
        this.parentLayer = builder.parentLayer;
        this.layerDisplayName = builder.layerDisplayName;
        this.icon = builder.icon;
        this.workflow = builder.workflow;
    }

    static fromJson(json: ContentInLayerJson): ContentInLayer {
        return new ContentInLayerBuilder().fromContentInLayerJson(json).build();
    }

    getId(): string {
        return this.id;
    }

    getPath(): string {
        return this.path;
    }

    getName(): string {
        return this.name;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getLanguage(): string {
        return this.language;
    }

    getLayerLanguage(): string {
        return this.layerLanguage;
    }

    getStatus(): CompareContentResult {
        return this.status;
    }

    isInherited(): boolean {
        return this.inherited;
    }

    getLayer(): string {
        return this.layer;
    }

    getParentLayer(): string {
        return this.parentLayer;
    }

    getLayerDisplayName(): string {
        return this.layerDisplayName;
    }

    getPublishFirstTime(): Date {
        return this.publishFirstTime;
    }

    getIcon(): Attachment {
        return this.icon;
    }

    getWorkflow(): Workflow {
        return this.workflow;
    }

    equals(o: api.Equitable): boolean {
        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, ContentInLayer)) {
            return false;
        }

        const other: ContentInLayer = <ContentInLayer>o;

        return api.ObjectHelper.stringEquals(this.name, other.getName());
    }
}

export class ContentInLayerBuilder {

    id: string;

    path: string;

    name: string;

    displayName: string;

    language: string;

    layerLanguage: string;

    publishFirstTime: Date;

    status: CompareContentResult;

    inherited: boolean;

    layer: string;

    parentLayer: string;

    layerDisplayName: string;

    icon: Attachment;

    workflow: Workflow;

    fromContentInLayerJson(json: ContentInLayerJson): ContentInLayerBuilder {
        this.id = json.id;
        this.path = json.path;
        this.name = json.name;
        this.displayName = json.displayName;
        this.language = json.language;
        this.layerLanguage = json.layerLanguage;
        this.status = json.status ? CompareContentResult.fromJson(json.status) : null;
        this.publishFirstTime = json.publishFirstTime ? new Date(Date.parse(json.publishFirstTime)) : null;
        this.inherited = json.inherited;
        this.layer = json.layer;
        this.parentLayer = json.parentLayer;
        this.layerDisplayName = json.layerDisplayName;
        this.icon = !!json.icon ? new AttachmentBuilder().fromJson(json.icon).build() : null;
        this.workflow = json.workflowInfo ? Workflow.fromJson(json.workflowInfo) : null;

        return this;
    }

    build(): ContentInLayer {
        return new ContentInLayer(this);
    }

    setId(value: string) {
        this.id = value;
    }

    setPath(value: string) {
        this.path = value;
    }

    setName(value: string) {
        this.name = value;
    }

    setDisplayName(value: string) {
        this.displayName = value;
    }

    setLanguage(value: string) {
        this.language = value;
    }

    setLayerLanguage(value: string) {
        this.layerLanguage = value;
    }

    setStatus(value: CompareContentResult) {
        this.status = value;
    }

    setPublishFirstTime(value: Date) {
        this.publishFirstTime = value;
    }

    setInherited(value: boolean) {
        this.inherited = value;
    }

    setLayer(value: string) {
        this.layer = value;
    }

    setParentLayer(value: string) {
        this.parentLayer = value;
    }

    setLayerDisplayName(value: string) {
        this.layerDisplayName = value;
    }

    setIcon(value: Attachment) {
        this.icon = value;
    }
}
