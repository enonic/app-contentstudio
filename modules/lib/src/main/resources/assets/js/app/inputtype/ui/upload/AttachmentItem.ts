import Q from 'q';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {Attachment} from '../../../attachment/Attachment';

export class AttachmentItem
    extends DivEl {

    private link: AEl;

    private removeEl: DivEl;

    private value: string;

    private dataBlock: DivEl;

    private errorBlock: DivEl;

    constructor(contentId: string, value: string, contentRootPath?: string) {
        super('attachment-item');

        this.value = value;
        this.dataBlock = new DivEl('data-block');
        this.errorBlock = new DivEl('error-block');

        this.link = new AEl().setUrl(Attachment.getUrl(contentId, value, contentRootPath));
        this.link.setHtml(value);

        this.initRemoveButton();
    }

    private initRemoveButton() {
        this.removeEl = new DivEl('icon remove icon-close');

        this.removeEl.onClicked(() => {
            this.remove();
        });
    }

    onRemoveClicked(callback: (value: any) => void) {
        this.removeEl.onClicked(() => {
            callback(this.value);
        });
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
