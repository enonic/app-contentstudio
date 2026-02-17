import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {AttachmentName} from './AttachmentName';
import {type AttachmentJson} from './AttachmentJson';
import {BinaryReference} from '@enonic/lib-admin-ui/util/BinaryReference';
import {UrlHelper} from '../util/UrlHelper';
import {type Project} from '../settings/data/project/Project';

export class Attachment
    implements Equitable {

    private name: AttachmentName;

    private label: string;

    private mimeType: string;

    private size: number;

    constructor(builder: AttachmentBuilder) {
        this.name = builder.name;
        this.label = builder.label;
        this.mimeType = builder.mimeType;
        this.size = builder.size;
    }

    getBinaryReference(): BinaryReference {
        return new BinaryReference(this.name.toString());
    }

    getName(): AttachmentName {
        return this.name;
    }

    getLabel(): string {
        return this.label;
    }

    getMimeType(): string {
        return this.mimeType;
    }

    getSize(): number {
        return this.size;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, Attachment)) {
            return false;
        }

        const other = o as Attachment;

        if (!ObjectHelper.equals(this.name, other.name)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.label, other.label)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.mimeType, other.mimeType)) {
            return false;
        }

        if (!ObjectHelper.numberEquals(this.size, other.size)) {
            return false;
        }

        return true;
    }

    toJson(): AttachmentJson {
        return {
            name: this.getName().toString(),
            label: this.getLabel(),
            mimeType: this.getMimeType(),
            size: this.getSize()
        };
    }

    static create(): AttachmentBuilder {
        return new AttachmentBuilder();
    }

    static getUrl(contentId: string, attachmentName: string, contentRootPath?: string, project?: Project) {
        const cmsPath = contentRootPath == null ? UrlHelper.getCMSPathForContentRoot() : UrlHelper.getCMSPath(contentRootPath, project);
        const uri = `${cmsPath}/content/media/${contentId}/${encodeURIComponent(attachmentName)}`;
        return UrlHelper.getCmsRestUri(uri);
    }
}

export class AttachmentBuilder {

    name: AttachmentName;

    label: string;

    mimeType: string;

    size: number;

    public fromJson(json: AttachmentJson): AttachmentBuilder {
        this.setName(new AttachmentName(json.name)).setLabel(json.label).setSize(json.size).setMimeType(json.mimeType);
        return this;
    }

    public setName(value: AttachmentName): AttachmentBuilder {
        this.name = value;
        return this;
    }

    public setLabel(value: string): AttachmentBuilder {
        this.label = value;
        return this;
    }

    public setMimeType(value: string): AttachmentBuilder {
        this.mimeType = value;
        return this;
    }

    public setSize(value: number): AttachmentBuilder {
        this.size = value;
        return this;
    }

    public build(): Attachment {
        return new Attachment(this);
    }
}
