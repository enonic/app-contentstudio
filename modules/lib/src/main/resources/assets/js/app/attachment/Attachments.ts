import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';
import {Attachment, AttachmentBuilder} from './Attachment';
import {AttachmentJson} from './AttachmentJson';

export class Attachments
    implements Equitable {

    private attachmentByName: { [s: string]: Attachment; } = {};

    private attachmentByLabel: { [s: string]: Attachment; } = {};

    private attachments: Attachment[] = [];

    private size: number;

    constructor(builder: AttachmentsBuilder) {

        let count: number = 0;
        builder.attachments.forEach((attachment: Attachment) => {
            this.attachmentByName[attachment.getName().toString()] = attachment;
            this.attachmentByLabel[attachment.getLabel()] = attachment;
            count++;
            this.attachments.push(attachment);
        });
        this.size = count;
    }

    forEach(callBack: { (attachment: Attachment, index: number): void; }): void {
        this.attachments.forEach((attachment: Attachment, index: number) => {
            callBack(attachment, index);
        });
    }

    getAttachmentByName(name: string): Attachment {
        return this.attachmentByName[name];
    }

    getAttachmentByLabel(label: string): Attachment {
        return this.attachmentByLabel[label];
    }

    getAttachment(index: number): Attachment {
        return this.attachments[index];
    }

    getSize(): number {
        return this.size;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, Attachments)) {
            return false;
        }

        let other: Attachments = <Attachments>o;

        return ObjectHelper.arrayEquals(this.attachments, other.attachments);
    }

    public static create(): AttachmentsBuilder {
        return new AttachmentsBuilder();
    }
}

export class AttachmentsBuilder {

    attachments: Attachment[] = [];

    public fromJson(jsons: AttachmentJson[]): AttachmentsBuilder {
        jsons.forEach((json: AttachmentJson) => {
            this.attachments.push(new AttachmentBuilder().fromJson(json).build());
        });
        return this;
    }

    public add(value: Attachment): AttachmentsBuilder {
        this.attachments.push(value);
        return this;
    }

    public addAll(value: Attachment[]): AttachmentsBuilder {
        value.forEach((attachment: Attachment) => {
            this.attachments.push(attachment);
        });
        return this;
    }

    public build(): Attachments {
        return new Attachments(this);
    }
}
