import * as Q from 'q';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {UriHelper} from 'lib-admin-ui/util/UriHelper';
import {ProjectContext} from '../../../project/ProjectContext';

export class AttachmentItem
    extends DivEl {

    private link: AEl;

    private removeEl: DivEl;

    private value: string;

    constructor(contentId: string, value: string, removeCallback?: (value: any) => void) {
        super('attachment-item');

        this.value = value;

        this.link = new AEl().setUrl(
            UriHelper.getRestUri(`cms/${ProjectContext.get().getProject()}/content/media/${contentId}/${encodeURIComponent(value)}`));
        this.link.setHtml(value);

        this.initRemoveButton(removeCallback);
    }

    private initRemoveButton(callback?: (value: any) => void) {
        this.removeEl = new DivEl('icon remove');

        this.removeEl.onClicked(() => {
            if (callback) {
                callback(this.value);
                this.remove();
            }
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
