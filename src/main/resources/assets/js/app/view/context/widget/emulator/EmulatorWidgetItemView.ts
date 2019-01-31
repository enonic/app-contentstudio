import {WidgetItemView} from '../../WidgetItemView';
import {LiveEditPageProxy} from '../../../../wizard/page/LiveEditPageProxy';
import {EmulatorGrid} from './EmulatorGrid';
import {EmulatorDevice} from './EmulatorDevice';
import {EmulatedEvent} from '../../../../event/EmulatedEvent';
import i18n = api.util.i18n;

export interface EmulatorWidgetItemViewConfig {
    liveEditPage?: LiveEditPageProxy;
}

export class EmulatorWidgetItemView
    extends WidgetItemView {

    private liveEditPage: LiveEditPageProxy;

    constructor(config: EmulatorWidgetItemViewConfig) {
        super('emulator-widget-item-view');

        this.liveEditPage = config.liveEditPage;

        this.initEmulationGrid();

        // Using jQuery since grid.setOnClick fires event twice, bug in slickgrid
        wemjq(this.getHTMLElement()).on('click', '.grid-row > div', (event: JQueryEventObject) => {

            const el = wemjq(event.currentTarget);
            const width = el.data('width');
            const height = el.data('height');
            const units = el.data('units');

            new EmulatedEvent(width, height, units).fire();
        });
    }

    private initEmulationGrid() {
        const dataView = new api.ui.grid.DataView<any>();
        const grid = new EmulatorGrid(dataView);

        dataView.setItems(EmulatorWidgetItemView.generateEmulatorDevices());
        // select first option
        grid.setActiveCell(0, 0);

        this.appendChild(grid);
    }

    private static generateEmulatorDevices(): EmulatorDevice[] {
        const data: EmulatorDevice[] = [];

        const fullSizeDevice: EmulatorDevice = new EmulatorDevice(0, i18n(
            'live.view.device.fullsize'), 'monitor', 100, 100, '%', true, false);
        const smallPhoneDevice: EmulatorDevice = new EmulatorDevice(1, i18n(
            'live.view.device.smallphone'), 'mobile', 320, 480, 'px', false, true);
        const mediumPhoneDevice: EmulatorDevice = new EmulatorDevice(2, i18n(
            'live.view.device.mediumphone'), 'mobile', 375, 667, 'px', false, true);
        const largePhoneDevice: EmulatorDevice = new EmulatorDevice(3, i18n(
            'live.view.device.largephone'), 'mobile', 414, 736, 'px', false, true);
        const tabletDevice: EmulatorDevice = new EmulatorDevice(4, i18n('live.view.device.tablet'), 'tablet', 768, 1024, 'px', false, true);
        const notebook13Device: EmulatorDevice = new EmulatorDevice(5, i18n(
            'live.view.device.notebook13'), 'monitor', 1280, 800, 'px', false, false);
        const notebook15Device: EmulatorDevice = new EmulatorDevice(6, i18n(
            'live.view.device.notebook15'), 'monitor', 1366, 768, 'px', false, false);
        const highDefinitionTVDevice: EmulatorDevice = new EmulatorDevice(7, i18n(
            'live.view.device.highDefinitionTV'), 'monitor', 1920, 1080, 'px', false, false);

        data.push(fullSizeDevice, smallPhoneDevice, mediumPhoneDevice, largePhoneDevice, tabletDevice, notebook13Device, notebook15Device,
            highDefinitionTVDevice);

        return data;
    }
}
