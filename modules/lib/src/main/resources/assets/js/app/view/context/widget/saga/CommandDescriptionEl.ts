import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import * as Q from 'q';

export class CommandDescriptionEl
    extends PEl {

    private editorLink: ButtonEl;

    constructor() {
        super('command-description');

        this.initElements();
    }

    protected initElements(): void {
        this.editorLink = new ButtonEl('command-editor-link').setHtml('@') as ButtonEl;
    }

    setLinkText(text: string): void {
        this.editorLink.setHtml(text);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(
                SpanEl.fromText('In '),
                this.editorLink,
                SpanEl.fromText(': '),
            );

            return rendered;
        });
    }
}
