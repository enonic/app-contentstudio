import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';

export class PagePlaceholderInfoBlock
    extends DivEl {

    private line1: DivEl;

    private line2: DivEl;

    constructor() {
        super('page-placeholder-info');

        this.line1 = new DivEl('page-placeholder-info-line1');
        this.line2 = new DivEl('page-placeholder-info-line2');

        this.appendChildren(this.line1, this.line2);
    }

    setTextForContent(contentTypeDisplayName: string) {
        this.toggleHeader(true);
        this.line2.setHtml(i18n('live.view.page.notemplates', contentTypeDisplayName));
    }

    toggleHeader(hasControllers: boolean) {
        this.line1.setHtml(hasControllers ? i18n('live.view.page.selectcontroller')
            : i18n('text.nocontrollers'));
    }

    setEmptyText() {
        this.toggleHeader(false);
        this.line2.setHtml(i18n('text.addapplications'));
    }

}
