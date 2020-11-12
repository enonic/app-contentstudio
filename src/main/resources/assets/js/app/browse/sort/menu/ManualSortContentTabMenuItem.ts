import {SortContentTabMenuItem, SortContentTabMenuItemBuilder} from './SortContentTabMenuItem';
import {i18n} from 'lib-admin-ui/util/Messages';
import {QueryField} from 'lib-admin-ui/query/QueryField';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
import * as Q from 'q';

export class ManualSortContentTabMenuItem extends SortContentTabMenuItem {

    constructor() {
        super(
            new ManualSortContentTabMenuItemBuilder().setFieldName(QueryField.MANUAL_ORDER_VALUE).setLabel(i18n('field.sortType.manual')));

            this.sortOrder = this.createChildOrder(QueryField.MANUAL_ORDER_VALUE, ChildOrder.DESC_ORDER_DIRECTION_VALUE);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('manual');

            return rendered;
        });
    }
}

export class ManualSortContentTabMenuItemBuilder
    extends SortContentTabMenuItemBuilder {

    setLabel(label: string): ManualSortContentTabMenuItemBuilder {
        return <ManualSortContentTabMenuItemBuilder>super.setLabel(label);
    }

    build(): ManualSortContentTabMenuItem {
        return new ManualSortContentTabMenuItem();
    }

}
