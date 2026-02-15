import {H5El} from '@enonic/lib-admin-ui/dom/H5El';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {FontIcon} from '../../../../icon/FontIcon';
import {type Insertable} from './Insertable';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {LiEl} from '@enonic/lib-admin-ui/dom/LiEl';

export interface InsertablesGridOptions {
    draggableRows?: boolean;
    rowClass?: string;
}

export class InsertablesGrid
    extends ListBox<Insertable> {

    private componentGridOptions: InsertablesGridOptions;

    constructor(options: InsertablesGridOptions = {}) {
        super('insertables-list');

        this.componentGridOptions = options;
    }

    protected createItemView(item: Insertable, readOnly: boolean): Element {
        return this.createView(item);
    }

    protected getItemId(item: Insertable): string {
        return item.getName();
    }

    private createView(insertable: Insertable): LiEl {
        const rowEl = new LiEl();
        rowEl.getEl().setData('portal-component-type', insertable.getName());
        if (this.componentGridOptions.draggableRows) {
            rowEl.getEl().setData('context-window-draggable', 'true');
        }
        if (this.componentGridOptions.rowClass) {
            rowEl.addClass(this.componentGridOptions.rowClass);
        }

        const icon = new FontIcon(insertable.getIconCls());

        const title = new H5El('title');
        title.getEl().setInnerHtml(insertable.getDisplayName());

        const subtitle = new H6El('subtitle');
        subtitle.getEl().setInnerHtml(insertable.getDescription());

        rowEl.appendChild(icon);
        rowEl.appendChild(title);
        rowEl.appendChild(subtitle);

        return rowEl;
    }
}
