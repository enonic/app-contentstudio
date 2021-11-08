import * as Q from 'q';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {UrlHelper} from '../../../util/UrlHelper';

export class AttachmentItem
    extends DivEl {

    private link: AEl;

    private removeEl: DivEl;

    private value: string;

    constructor(contentId: string, value: string) {
        super('attachment-item');

        this.value = value;

        this.link = new AEl().setUrl(
            UrlHelper.getCmsRestUri(`${UrlHelper.getCMSPath()}/content/media/${contentId}/${encodeURIComponent(value)}`));
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

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {

            this.removeChildren();
            this.appendChildren(this.removeEl, this.link);

            return rendered;
        });
    }
}
