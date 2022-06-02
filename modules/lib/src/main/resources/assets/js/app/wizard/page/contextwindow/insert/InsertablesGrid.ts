import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Grid} from '@enonic/lib-admin-ui/ui/grid/Grid';
import {GridOptions, GridOptionsBuilder} from '@enonic/lib-admin-ui/ui/grid/GridOptions';
import {GridColumn, GridColumnBuilder} from '@enonic/lib-admin-ui/ui/grid/GridColumn';
import {H5El} from '@enonic/lib-admin-ui/dom/H5El';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {DataView} from '@enonic/lib-admin-ui/ui/grid/DataView';
import {FontIcon} from '../../../../icon/FontIcon';
import {Insertable} from './Insertable';

export interface InsertablesGridOptions {
    draggableRows?: boolean;
    rowClass?: string;
    onClick?: (event: MouseEvent) => void;
}

export class InsertablesGrid
    extends Grid<Insertable> {

    private componentGridOptions: InsertablesGridOptions;

    constructor(dataView: DataView<Insertable>, options: InsertablesGridOptions = {}) {

        super(dataView);

        this.componentGridOptions = options;

        this.onRendered(() => {
            if (this.componentGridOptions.onClick) {
                this.setOnClick(this.componentGridOptions.onClick);
            }
        });
    }

    protected createOptions(): GridOptions<any> {
        return new GridOptionsBuilder()
            .setHideColumnHeaders(true)
            .setRowHeight(50)
            .build();
    }

    protected createColumns(): GridColumn<Insertable>[] {
        return [
            new GridColumnBuilder()
                .setName('component')
                .setField('component')
                .setId('component')
                .setBoundaryWidth(150, 9999)
                .setCssClass('grid-row')
                .setFormatter((row, cell, value, columnDef, dataContext) => {
                    return this.buildRow(row, cell, value, columnDef, <Insertable>dataContext).toString();
                }).build()
        ];
    }

    private buildRow(row: number, cell: number, value: any, columnDef: any, insertable: Insertable): DivEl {
        let rowEl = new DivEl();
        rowEl.getEl().setData('portal-component-type', insertable.getName());
        if (this.componentGridOptions.draggableRows) {
            rowEl.getEl().setData('context-window-draggable', 'true');
        }
        if (this.componentGridOptions.rowClass) {
            rowEl.addClass(this.componentGridOptions.rowClass);
        }

        let icon = new FontIcon(insertable.getIconCls());

        let title = new H5El();
        title.getEl().setInnerHtml(insertable.getDisplayName());

        let subtitle = new H6El();
        subtitle.getEl().setInnerHtml(insertable.getDescription());

        rowEl.appendChild(icon);
        rowEl.appendChild(title);
        rowEl.appendChild(subtitle);

        return rowEl;
    }
}
