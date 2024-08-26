import {WidgetItemView} from '../../WidgetItemView';
import {EmulatorGrid, EmulatorListElement} from './EmulatorGrid';
import {EmulatorDevice} from './EmulatorDevice';
import {EmulatedEvent} from '../../../../event/EmulatedEvent';

export interface EmulatorDeviceRow {
    id: number;
    device: EmulatorDevice;
}

export class EmulatorWidgetItemView
    extends WidgetItemView {

    private devicesRows: EmulatorDeviceRow[];

    constructor() {
        super('emulator-widget-item-view');

        this.generateEmulatorDevicesRows();
        this.initEmulationGrid();
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
        const grid = new EmulatorGrid();

        grid.setItems(this.devicesRows);
        grid.setActive(this.devicesRows[0].device);

        grid.getItemViews().forEach((view: EmulatorListElement) => {
            view.onClicked(() => {
                const width = view.getEl().getData('width');
                const height = view.getEl().getData('height');
                const units = view.getEl().getData('units');

                grid.setActive(view.getItem().device);

                const deviceRow = this.findDeviceBySize(+width, +height, units);

                if (deviceRow) {
                    new EmulatedEvent(deviceRow.device).fire();
                }
            });
        });

        EmulatedEvent.on((event: EmulatedEvent) => {
            if (!event.isEmulator()) {
                // sync selected device with external event
                this.devicesRows.some((row: EmulatorDeviceRow) => {
                    if (row.device.equals(event.getDevice())) {
                        grid.setActive(event.getDevice());
                        return true;
                    }
                    return false;
                });
            }
        });

        this.appendChild(grid);
    }

    private findDeviceBySize(width: number, height: number, units: string): EmulatorDeviceRow {
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
