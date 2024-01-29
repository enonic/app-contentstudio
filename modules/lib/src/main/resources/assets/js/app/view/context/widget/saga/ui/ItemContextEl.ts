import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import * as Q from 'q';
import {SagaWidgetItemViewData} from '../SagaWidgetItemView';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';

export class ItemContextEl
    extends PEl {

    private editorLink: ButtonEl;

    private selectedTextIntro: DivEl;

    private selectedTextSection: DivEl;

    private data: SagaWidgetItemViewData;

    constructor() {
        super('session-context');

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.editorLink = new ButtonEl('command-editor-link').setHtml('@') as ButtonEl;
        this.selectedTextIntro = new DivEl('selected-text-intro').setHtml('with selected text');
        this.selectedTextSection = new DivEl('selected-text-section');
    }

    protected initListeners(): void {
        this.editorLink.onClicked(() => {
            this.data.editor.focus();
            this.data.editor.getHTMLElement().parentElement.scrollIntoView();
        });
    }

    update(data: SagaWidgetItemViewData): void {
        this.data = data;

        this.updateLinkEl();

        if (StringHelper.isBlank(this.data.selection?.text)) {
            this.updateContextNoSelection();
        } else {
            this.updateContextWithSelection();
        }
    }

    private updateLinkEl(): void {
        this.editorLink.setHtml(this.data.label || this.data.editor.getName());
    }

    private updateContextNoSelection(): void {
        this.toggleClass('no-selection', true);
        this.toggleClass('has-selection', false);
        this.selectedTextSection.setHtml('');
    }

    private updateContextWithSelection(): void {
        this.toggleClass('no-selection', false);
        this.toggleClass('has-selection', true);
        this.selectedTextSection.setHtml(this.data.selection.text);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const heading = new DivEl('session-header');
            const selectedTextWrapper = new DivEl('session-body');

            heading.appendChildren(SpanEl.fromText('In '),
                this.editorLink,
                this.selectedTextIntro,
                SpanEl.fromText(': '));

            selectedTextWrapper.appendChildren(this.selectedTextSection);
            this.appendChildren(heading, selectedTextWrapper);

            return rendered;
        });
    }
}
