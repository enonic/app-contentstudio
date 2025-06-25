import {useCallback, type ReactElement, useState} from 'react';
import {Button, Menu, Toolbar} from '@enonic/ui';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {EmulatorDevice} from '../../../../../../app/view/context/widget/emulator/EmulatorDevice';
import {EmulatedDeviceEvent} from '../../../../utils/dom/events/registry';
import {useI18n} from '../../../../hooks/useI18n';

const EMULATORS = [
    EmulatorDevice.getFullscreen(),
    EmulatorDevice.getSmallPhone(),
    EmulatorDevice.getMediumPhone(),
    EmulatorDevice.getLargePhone(),
    EmulatorDevice.getTablet(),
    EmulatorDevice.getNotebook13(),
    EmulatorDevice.getNotebook15(),
    EmulatorDevice.getHDTV(),
];

function getEmulatorKey(device: EmulatorDevice): string {
    return device.getName();
}

export const PreviewToolbarEmulatorSelector = (): ReactElement => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<EmulatorDevice>(EmulatorDevice.getFullscreen());
    const [radioControlKey, setRadioControlKey] = useState<string>(getEmulatorKey(EmulatorDevice.getFullscreen()));

    const handleDeviceSelect = useCallback((device: EmulatorDevice) => {
        setSelectedDevice(device);
        setIsOpen(false);
        EmulatedDeviceEvent.dispatch(device);
    }, []);

    const SelectedIcon = selectedDevice.getIcon();

    return (
        <Menu open={isOpen} onOpenChange={setIsOpen}>
            <Toolbar.Item asChild>
                <Menu.Trigger asChild>
                    <Button
                        className="group"
                        endIcon={isOpen ? ChevronUp : ChevronDown}
                        size="sm"
                        aria-label={useI18n('wcag.preview.toolbar.emulatorSelector.label')}
                    >
                        <SelectedIcon className="size-3.5 text-main group-data-[active=true]:text-rev @sm:hidden" />
                        <span className="hidden @sm:inline">{selectedDevice.getWidthWithUnits()}</span>
                    </Button>
                </Menu.Trigger>
            </Toolbar.Item>
            <Menu.Portal>
                <Menu.Content>
                    <Menu.RadioGroup value={radioControlKey} onValueChange={setRadioControlKey}>
                        {EMULATORS.map((device) => {
                            const DeviceIcon = device.getIcon();

                            return (
                                <Menu.RadioItem
                                    key={getEmulatorKey(device)}
                                    value={getEmulatorKey(device)}
                                    onClick={() => handleDeviceSelect(device)}
                                >
                                    <Menu.ItemIndicator>
                                        <DeviceIcon className="size-6 text-main group-data-[state=checked]:text-rev" />
                                    </Menu.ItemIndicator>
                                    <p className="ml-2">
                                        <span className="font-semibold block">{device.getName()}</span>
                                        <span className="text-xs text-subtle group-data-[state=checked]:text-alt">
                                            {device.getWidthWithUnits()} * {device.getHeightWithUnits()}
                                        </span>
                                    </p>
                                </Menu.RadioItem>
                            );
                        })}
                    </Menu.RadioGroup>
                </Menu.Content>
            </Menu.Portal>
        </Menu>
    );
};

PreviewToolbarEmulatorSelector.displayName = 'PreviewToolbarEmulatorSelector';
