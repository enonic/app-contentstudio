import {EmulatorDeviceItem} from './EmulatorDevice';
import {FontIcon} from '../../../../icon/FontIcon';

export class EmulatorGrid extends api.ui.grid.Grid<any> {

    protected createOptions(): api.ui.grid.GridOptions<any> {
        return new api.ui.grid.GridOptionsBuilder().setHideColumnHeaders(true).setRowHeight(50).setHeight('450px').setWidth('320px')
            .build();
    }

    protected createColumns(): api.ui.grid.GridColumn<any>[] {
        return [
            new api.ui.grid.GridColumnBuilder()
                .setName('device')
                .setField('device')
                .setId('device')
                .setWidth(320)
                .setCssClass('grid-row')
                .setFormatter((row, cell, value) => EmulatorGrid.buildRow(value).toString())
                .build()
        ];
    }

    private static buildRow(data: EmulatorDeviceItem): api.dom.DivEl {
        const rowEl = new api.dom.DivEl();
        rowEl.getEl().setData('width', data.getWidth().toString());
        rowEl.getEl().setData('height', data.getHeight().toString());
        rowEl.getEl().setData('units', data.getUnits());

        const icon = new FontIcon('icon-' + data.getDeviceType());

        const title = new api.dom.H5El();
        title.getEl().setInnerHtml(data.getName());

        const subtitle = new api.dom.H6El();
        const units = data.getDisplayUnits() ? data.getUnits() : '';
        subtitle.getEl().setInnerHtml(data.getWidth().toString() + units + ' &times; ' + data.getHeight().toString() + units, false);
        rowEl.appendChild(icon);
        rowEl.appendChild(title);
        rowEl.appendChild(subtitle);

        if (data.getRotatable() === true) {
            const rotator = new api.dom.DivEl();
            rotator.addClass('rotate');
            rotator.addClassEx('icon-loop');
            rowEl.appendChild(rotator);
        }

        return rowEl;
    }

}
