import './../api.ts';
import i18n = api.util.i18n;

export class PagePlaceholderInfoBlock
    extends api.dom.DivEl {

    private line1: api.dom.DivEl;

    private line2: api.dom.DivEl;

    constructor() {
        super('page-placeholder-info');

        this.line1 = new api.dom.DivEl('page-placeholder-info-line1');
        this.line2 = new api.dom.DivEl('page-placeholder-info-line2');

        this.appendChildren(this.line1, this.line2);
    }

    setTextForContent(contentTypeDisplayName: string) {
        this.toggleHeader(true);
        this.line2.setHtml(i18n('live.view.page.notemplates', contentTypeDisplayName));
    }

    toggleHeader(hasControllers: boolean) {
        this.line1.setHtml(hasControllers ? i18n('live.view.page.selectcontroller')
            : i18n('live.view.page.nocontrollers'));
    }

    setEmptyText() {
        this.toggleHeader(false);
        this.line2.setHtml(i18n('live.view.page.addapplications'));
    }

}
