import type Q from 'q';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {Attachment} from '../../../attachment/Attachment';
import {type Project} from '../../../settings/data/project/Project';

export class AttachmentItem
    extends DivEl {

    private readonly link: AEl;

    private removeEl: DivEl;

    private readonly value: string;

    private readonly dataBlock: DivEl;

    private readonly errorBlock: DivEl;

    constructor(contentId: string, value: string, contentRootPath?: string, project?: Project) {
        super('attachment-item');

        this.value = value;
        this.dataBlock = new DivEl('data-block');
        this.errorBlock = new DivEl('error-block');

        this.link = new AEl().setUrl(Attachment.getUrl(contentId, value, contentRootPath, project));
        this.link.setHtml(value);

        this.initRemoveButton();
    }

    private initRemoveButton() {
        this.removeEl = new DivEl('icon remove icon-close');

        this.removeEl.onClicked(() => {
            this.remove();
        });
    }

    onRemoveClicked(callback: (value: string) => void) {
        this.removeEl.onClicked(() => callback(this.value));
    }

    getValue(): string {
        return this.value;
    }

    setError(text: string) {
        this.errorBlock.setHtml(text);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.removeChildren();

            this.dataBlock.appendChildren(this.removeEl, this.link);
            this.appendChildren(this.dataBlock, this.errorBlock);

            return rendered;
        });
    }
}
