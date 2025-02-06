import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {EmulatorDevice} from './EmulatorDevice';
import {FontIcon} from '../../../../icon/FontIcon';
import {H5El} from '@enonic/lib-admin-ui/dom/H5El';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {EmulatorDeviceRow} from './EmulatorWidgetItemView';
import {LiEl} from '@enonic/lib-admin-ui/dom/LiEl';

export class EmulatorGrid
    extends ListBox<EmulatorDeviceRow> {

    protected createItemView(item: EmulatorDeviceRow, readOnly: boolean): EmulatorListElement {
        return this.createView(item);
    }

    protected getItemId(item: EmulatorDeviceRow): string {
        return '' + item.id;
    }

    private createView(item: EmulatorDeviceRow): EmulatorListElement {
        const data = item.device;
        const rowEl = new EmulatorListElement(item);
        rowEl.getEl().setData('width', data.getWidth().toString());
        rowEl.getEl().setData('height', data.getHeight().toString());
        rowEl.getEl().setData('units', data.getUnits());

        const icon = new FontIcon('icon-' + data.getDeviceTypeAsString());

        const title = new H5El('title');
        title.getEl().setInnerHtml(data.getName());

        const subtitle = new H6El('subtitle');
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

    setActive(item: EmulatorDevice): void {
        this.getItemViews().forEach((view: EmulatorListElement) => {
            view.toggleClass('active', view.getItem().device.getName() === item.getName());
        });
    }
}

export class EmulatorListElement
    extends LiEl {

    private readonly item: EmulatorDeviceRow;

    constructor(item: EmulatorDeviceRow) {
        super('grid-row');

        this.item = item;
    }

    getItem(): EmulatorDeviceRow {
        return this.item;
    }

}
