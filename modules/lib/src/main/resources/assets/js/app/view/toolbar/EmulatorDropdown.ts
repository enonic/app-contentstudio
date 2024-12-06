import {FilterableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';
import Q from 'q';
import {EmulatorDevice} from '../context/widget/emulator/EmulatorDevice';
import {EmulatedEvent} from '../../event/EmulatedEvent';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';


export class EmulatorDropdown
    extends FilterableListBoxWrapper<EmulatorDevice> {

    private selectedOption: EmulatorOptionViewer;

    constructor() {
        super(new EmulatorListBox(), {
            className: 'emulator-dropdown preview-toolbar-dropdown',
            maxSelected: 1,
            filter: (item: EmulatorDevice, searchString: string): boolean => {
                return item.getName().toLowerCase().indexOf(searchString.toLowerCase()) > -1 ||
                       item.getDeviceType().toString().indexOf(searchString.toLowerCase()) > -1 ||
                       item.getWidth().toString().indexOf(searchString.toLowerCase()) > -1 ||
                       item.getHeight().toString().indexOf(searchString.toLowerCase()) > -1;
            }
        });

        this.selectedOption = new EmulatorOptionViewer(false);
        this.selectedOption.addClass('selected-option').hide();

        this.selectedOption.onClicked(() => {
            this.handleDropdownHandleClicked();
        });

        this.getList().setItems(this.fetchEmulatorDevices());
        this.doSelect(this.getList().getItems()[0]);

        this.listenToEmulatedEvent();
    }

    private listenToEmulatedEvent() {
        EmulatedEvent.on((event: EmulatedEvent) => {
            if (!event.isEmulator()) {
                // sync selected device with external event
                const deviceRow = this.getList().getItems().find((item: EmulatorDevice) => {
                    return item.getName() === event.getDevice().getName();
                });
                if (deviceRow) {
                    this.doSelect(deviceRow);
                }
            }
        });
    }

    private fetchEmulatorDevices(): EmulatorDevice[] {
        return [
            EmulatorDevice.getFullscreen(),
            EmulatorDevice.getSmallPhone(),
            EmulatorDevice.getMediumPhone(),
            EmulatorDevice.getLargePhone(),
            EmulatorDevice.getTablet(),
            EmulatorDevice.getNotebook13(),
            EmulatorDevice.getNotebook15(),
            EmulatorDevice.getHDTV()
        ];
    }

    protected handleUserToggleAction(item: EmulatorDevice): void {
        if (this.isItemSelected(item)) {
            return;
        }

        super.handleUserToggleAction(item);
    }

    protected doSelect(item: EmulatorDevice) {
        this.selectedOption.setObject(item);
        this.selectedOption.show();
        new EmulatedEvent(item, true).fire();
        super.doSelect(item);
    }

    protected doDeselect(item: EmulatorDevice) {
        this.selectedOption.hide();
        super.doDeselect(item);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {

            this.optionFilterInput.replaceWith(this.selectedOption);
            this.applyButton.remove();

            return rendered;
        });
    }
}

export class EmulatorListBox
    extends ListBox<EmulatorDevice> {

    protected createItemView(item: EmulatorDevice, _readOnly: boolean): EmulatorOptionViewer {
        const viewer = new EmulatorOptionViewer();
        viewer.setObject(item);
        return viewer;
    }

    protected getItemId(item: EmulatorDevice): string {
        return `${item.getDeviceTypeAsString()}:${item.getWidthWithUnits()}*${item.getHeightWithUnits()}`;
    }

    setActive(item: EmulatorDevice): void {
        this.getItemViews().forEach((view: EmulatorOptionViewer) => {
            view.toggleClass('active', view.getObject().getName() === item.getName());
        });
    }
}

export class EmulatorOptionViewer
    extends NamesAndIconViewer<EmulatorDevice> {

    private listItem: boolean;

    constructor(listItem: boolean = true) {
        super('emulator-option-viewer', NamesAndIconViewSize.compact);
        this.listItem = listItem;
    }

    doLayout(object: EmulatorDevice) {
        super.doLayout(object);

        const view = this.getNamesAndIconView();
        if (object && view) {
            view.getEl().setAttribute('role', 'button');
        }
    }

    resolveDisplayName(object: EmulatorDevice): string {
        return this.listItem ? object.getName() : object.getWidthWithUnits();
    }

    resolveSubName(object: EmulatorDevice): string {
        return `${object.getWidthWithUnits()} * ${object.getHeightWithUnits()}`;
    }

    resolveIconClass(object: EmulatorDevice): string {
        const cls = `font-icon ${StyleHelper.getIconCls(object.getDeviceTypeAsString())}`;
        return StyleHelper.getCls(cls, null);

    }
}