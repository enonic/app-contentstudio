import {SummaryItemContainer} from './SummaryItemContainer';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ProjectApplication} from '../../../../../wizard/panel/form/element/ProjectApplication';

export class SummaryValueContainer extends SummaryItemContainer {

    constructor(className?: string) {
        super('summary-value-container ' + (className ? className : ''));
    }

    protected createItemContainer(): Element {
        return new H6El('default-item-value-container');
    }

    updateValue(value: unknown): SummaryValueContainer {
        this.itemContainer.setHtml(value as string);
        return this;
    }
}
