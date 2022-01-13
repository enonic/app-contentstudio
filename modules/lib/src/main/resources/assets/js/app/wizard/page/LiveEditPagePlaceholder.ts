import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {i18n} from 'lib-admin-ui/util/Messages';

export class LiveEditPagePlaceholder
    extends DivEl {

    constructor() {
        super('page-placeholder');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const pagePlaceholderInfo: DivEl = new DivEl('page-placeholder-info');
            const line1: DivEl = new DivEl('page-placeholder-info-line1').setHtml(i18n('text.nocontrollers'));
            const line2: DivEl = new DivEl('page-placeholder-info-line2').setHtml(i18n('text.addapplications'));

            pagePlaceholderInfo.appendChildren(line1, line2);
            this.appendChild(pagePlaceholderInfo);

            return rendered;
        });
    }
}
