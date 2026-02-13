import {type SortContentTabMenuItem} from './SortContentTabMenuItem';
import {QueryField} from '@enonic/lib-admin-ui/query/QueryField';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {InheritedSortContentTabMenuItem} from './InheritedSortContentTabMenuItem';
import {AscDescSortContentTabMenuItem} from './AscDescSortContentTabMenuItem';
import {ManualSortContentTabMenuItem} from './ManualSortContentTabMenuItem';

export class SortContentTabMenuItems {

    private sortManualItem: SortContentTabMenuItem;

    private inheritedItem: InheritedSortContentTabMenuItem;

    private items: SortContentTabMenuItem[] = [];

    constructor() {
        this.sortManualItem = new ManualSortContentTabMenuItem();

        this.inheritedItem = new InheritedSortContentTabMenuItem();

        this.items.push(
            AscDescSortContentTabMenuItem.create().setFieldName(QueryField.MODIFIED_TIME).setLabel(i18n('field.sortType.modified')).build(),
            AscDescSortContentTabMenuItem.create().setFieldName(QueryField.CREATED_TIME).setLabel(i18n('field.sortType.created')).build(),
            AscDescSortContentTabMenuItem.create().setFieldName(QueryField.DISPLAY_NAME).setLabel(
                i18n('field.sortType.displayName')).build(),
            AscDescSortContentTabMenuItem.create().setFieldName(QueryField.PUBLISH_FIRST).setLabel(i18n('field.sortType.publish')).build(),
            this.sortManualItem,
            this.inheritedItem
        );
    }

    getManualItemIndex(): number {
        return this.items.indexOf(this.sortManualItem);
    }

}
