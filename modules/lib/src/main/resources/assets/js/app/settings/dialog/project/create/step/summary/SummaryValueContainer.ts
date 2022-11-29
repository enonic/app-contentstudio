import {SummaryItemContainer} from './SummaryItemContainer';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export class SummaryValueContainer extends SummaryItemContainer {

    constructor(className?: string) {
        super(`summary-value-container ${className ?? ''}`);
    }

    protected createItemContainer(): Element {
        return new H6El('default-item-value-container');
    }

    updateValue(value: any): SummaryValueContainer {
        this.itemContainer.setHtml(value);
        return this;
    }
}
