import {SortContentTabMenuItem, SortContentTabMenuItemBuilder} from './SortContentTabMenuItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import {ChildOrder} from '../../../resource/order/ChildOrder';

export class InheritedSortContentTabMenuItem extends SortContentTabMenuItem {

    constructor() {
        super(new InheritedSortContentTabMenuItemBuilder());
    }

    setOrder(order: ChildOrder, label: string, iconClass: string) {
        this.sortOrder = order;
        this.updateIconClass(iconClass);
        this.setLabel(`${i18n('field.sortType.inherited')}: ${label}`);
    }

    private updateIconClass(iconClass: string) {
        if (this.iconClass) {
            this.getFirstChild().removeClass(this.iconClass);
        }

        this.iconClass = iconClass;

        if (this.iconClass) {
            this.getFirstChild().addClass(this.iconClass);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('inherited');

            return rendered;
        });
    }
}

export class InheritedSortContentTabMenuItemBuilder
    extends SortContentTabMenuItemBuilder {

    setLabel(label: string): InheritedSortContentTabMenuItemBuilder {
        return super.setLabel(label) as InheritedSortContentTabMenuItemBuilder;
    }

    build(): InheritedSortContentTabMenuItem {
        return new InheritedSortContentTabMenuItem();
    }

}
