import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ContentType} from '../app/inputtype/schema/ContentType';

export class PagePlaceholderInfoBlock
    extends DivEl {

    private readonly line1: DivEl;

    private readonly line2: DivEl;

    constructor(contentType?: ContentType) {
        super('page-placeholder-info');

        this.line1 = new DivEl('page-placeholder-info-line1');
        this.line2 = new DivEl('page-placeholder-info-line2');

        this.appendChildren(this.line1, this.line2);

        if (contentType) {
            this.setTextForContent(contentType.getDisplayName());
        } else {
            this.setEmptyText();
        }
    }

    setTextForContent(contentTypeDisplayName: string): PagePlaceholderInfoBlock {
        this.toggleHeader(true);
        this.line2.setHtml(i18n('text.notemplates', contentTypeDisplayName));

        return this;
    }

    toggleHeader(hasControllers: boolean): PagePlaceholderInfoBlock {
        this.line1.setHtml(hasControllers ? i18n('text.selectcontroller')
            : i18n('text.nocontrollers'));

        return this;
    }

    setEmptyText(): PagePlaceholderInfoBlock {
        this.toggleHeader(false);
        this.line2.setHtml(i18n('text.addapplications'));
        return this;
    }

    setErrorTexts(message: string, description: string): PagePlaceholderInfoBlock {
        this.line1.setHtml(message);
        this.line2.setHtml(description);

        return this;
    }

}
