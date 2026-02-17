import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {SummaryItemContainer} from './SummaryItemContainer';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';

export class SummaryNameContainer
    extends SummaryItemContainer {

    constructor() {
        super('summary-name-container');
    }

    protected createItemContainer(): Element {
        return new H6El();
    }

    updateName(value: string): SummaryNameContainer {
        this.itemContainer.setHtml(value);
        return this;
    }
}
