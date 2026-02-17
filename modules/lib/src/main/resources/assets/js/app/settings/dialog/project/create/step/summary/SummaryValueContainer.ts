import {SummaryItemContainer} from './SummaryItemContainer';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';

export class SummaryValueContainer
    extends SummaryItemContainer {

    constructor(className?: string) {
        super(`summary-value-container ${className ?? ''}`);
    }

    protected createItemContainer(): Element {
        return new H6El('default-item-value-container');
    }

    updateValue(value: unknown): SummaryValueContainer {
        this.itemContainer.setHtml(value as string);
        return this;
    }
}
