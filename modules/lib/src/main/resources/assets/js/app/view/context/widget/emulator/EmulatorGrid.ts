import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {EmulatorDevice} from './EmulatorDevice';
import {FontIcon} from '../../../../icon/FontIcon';
import {Grid} from '@enonic/lib-admin-ui/ui/grid/Grid';
import {GridOptions, GridOptionsBuilder} from '@enonic/lib-admin-ui/ui/grid/GridOptions';
import {GridColumn, GridColumnBuilder} from '@enonic/lib-admin-ui/ui/grid/GridColumn';
import {H5El} from '@enonic/lib-admin-ui/dom/H5El';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';

export class EmulatorGrid
    extends Grid<Slick.SlickData> {

    protected createOptions(): GridOptions<Slick.SlickData> {
        return new GridOptionsBuilder()
            .setHideColumnHeaders(true)
            .setRowHeight(50)
            .setWidth('100%')
            .setRerenderOnResize(false)
            .build();
    }

    protected createColumns(): GridColumn<Slick.SlickData>[] {
        return [
            new GridColumnBuilder()
                .setName('device')
                .setField('device')
                .setId('device')
                .setBoundaryWidth(150, 9999)
                .setCssClass('grid-row')
                .setFormatter((row, cell, value) => EmulatorGrid.buildRow(value).toString())
                .build()
        ];
    }

    private static buildRow(data: EmulatorDevice): DivEl {
        const rowEl = new DivEl();
        rowEl.getEl().setData('width', data.getWidth().toString());
        rowEl.getEl().setData('height', data.getHeight().toString());
        rowEl.getEl().setData('units', data.getUnits());

        const icon = new FontIcon('icon-' + data.getDeviceTypeAsString());

        const title = new H5El();
        title.getEl().setInnerHtml(data.getName());

        const subtitle = new H6El();
        const units = data.getDisplayUnits() ? data.getUnits() : '';
        subtitle.setHtml(`${data.getWidth().toString()}${units} × ${data.getHeight().toString()}${units}`);
        rowEl.appendChild(icon);
        rowEl.appendChild(title);
        rowEl.appendChild(subtitle);

        if (data.getRotatable() === true) {
            const rotator = new DivEl();
            rotator.addClass('rotate');
            rotator.addClassEx('icon-loop');
            rowEl.appendChild(rotator);
        }

        return rowEl;
    }

}
