import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {H6El} from 'lib-admin-ui/dom/H6El';

export class ImageStyleNameView
    extends DivEl {

    private mainNameEl: H6El;

    private addTitleAttribute: boolean;

    constructor(addTitleAttribute: boolean = true) {
        super('names-view', StyleHelper.COMMON_PREFIX);

        this.addTitleAttribute = addTitleAttribute;

        this.mainNameEl = new H6El('main-name', StyleHelper.COMMON_PREFIX);
        this.appendChild(this.mainNameEl);
    }

    setMainName(value: string): ImageStyleNameView {
        this.mainNameEl.setHtml(value);
        if (this.addTitleAttribute) {
            this.mainNameEl.getEl().setAttribute('title', value);
        }
        return this;
    }
}
