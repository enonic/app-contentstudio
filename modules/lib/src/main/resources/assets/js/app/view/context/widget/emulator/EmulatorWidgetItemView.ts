import * as $ from 'jquery';
import {WidgetItemView} from '../../WidgetItemView';
import {LiveEditPageProxy} from '../../../../wizard/page/LiveEditPageProxy';
import {EmulatorGrid} from './EmulatorGrid';
import {EmulatorDevice} from './EmulatorDevice';
import {EmulatedEvent} from '../../../../event/EmulatedEvent';
import {DataView} from 'lib-admin-ui/ui/grid/DataView';

export interface EmulatorWidgetItemViewConfig {
    liveEditPage?: LiveEditPageProxy;
}

export interface EmulatorDeviceRow {
    id: number;
    device: EmulatorDevice;
}

export class EmulatorWidgetItemView
    extends WidgetItemView {

    private devicesRows: EmulatorDeviceRow[];

    private liveEditPage: LiveEditPageProxy;

    constructor(config: EmulatorWidgetItemViewConfig) {
        super('emulator-widget-item-view');

        this.liveEditPage = config.liveEditPage;

        this.generateEmulatorDevicesRows();
        this.initEmulationGrid();

        // Using jQuery since grid.setOnClick fires event twice, bug in slickgrid
        $(this.getHTMLElement()).on('click', '.grid-row > div', (event: JQueryEventObject) => {

            const el = $(event.currentTarget);
            const width = el.data('width');
            const height = el.data('height');
            const units = el.data('units');

            const deviceRow = this.findRowBySize(width, height, units);
            if (deviceRow) {
                new EmulatedEvent(deviceRow.device).fire();
            }
        });
    }

    private generateEmulatorDevicesRows() {
        this.devicesRows = [
            EmulatorDevice.getFullscreen(),
            EmulatorDevice.getSmallPhone(),
            EmulatorDevice.getMediumPhone(),
            EmulatorDevice.getLargePhone(),
            EmulatorDevice.getTablet(),
            EmulatorDevice.getNotebook13(),
            EmulatorDevice.getNotebook15(),
            EmulatorDevice.getHDTV()
        ].map((device: EmulatorDevice, id: number) => ({id, device}));
    }

    private initEmulationGrid() {
        const dataView = new DataView<any>();
        const grid = new EmulatorGrid(dataView);

        dataView.setItems(this.devicesRows);
        grid.setActiveCell(0, 0);

        EmulatedEvent.on((event: EmulatedEvent) => {
            if (!event.isEmulator()) {
                // sync selected device with external event
                this.devicesRows.some((row: EmulatorDeviceRow, index: number) => {
                    if (row.device.equals(event.getDevice())) {
                        grid.setActiveCell(index, 0);
                        return true;
                    }
                    return false;
                });
            }
        });

        this.appendChild(grid);
    }

    private findRowBySize(width: number, height: number, units: string): EmulatorDeviceRow {
        let row: EmulatorDeviceRow = null;

        this.devicesRows.some((deviceRow: EmulatorDeviceRow) => {
            if (deviceRow.device.equalsBySize(width, height, units)) {
                row = deviceRow;
                return true;
            }
            return false;
        });

        return row;
    }
}
