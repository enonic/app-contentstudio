import {useCallback, type ReactElement, useState} from 'react';
import {Button, cn, Menu} from '@enonic/ui';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {EmulatorDevice} from '../../../../../../app/view/context/widget/emulator/EmulatorDevice';
import {EmulatedDeviceEvent} from '../../../../utils/events/registry';

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

const getDeviceIcon = (device: EmulatorDevice, className?: string) => {
    const Icon = device.getIcon();

    return (
        <Icon
            size={className?.includes('@sm:hidden') ? 14 : 24}
            className={cn('stroke-black group-data-[state=checked]:stroke-white dark:stroke-white', className)}
        />
    );
};

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

    return (
        <Menu open={isOpen} onOpenChange={setIsOpen}>
            <Menu.Trigger asChild>
                <Button endIcon={isOpen ? ChevronUp : ChevronDown} size="sm">
                    {getDeviceIcon(selectedDevice, '@sm:hidden')}
                    <span className="hidden @sm:inline">{selectedDevice.getWidthWithUnits()}</span>
                </Button>
            </Menu.Trigger>
            <Menu.Portal>
                <Menu.Content>
                    <Menu.RadioGroup value={radioControlKey} onValueChange={setRadioControlKey}>
                        {EMULATORS.map((device) => (
                            <Menu.RadioItem
                                key={getEmulatorKey(device)}
                                value={getEmulatorKey(device)}
                                onClick={() => handleDeviceSelect(device)}
                            >
                                <Menu.ItemIndicator>{getDeviceIcon(device)}</Menu.ItemIndicator>
                                <p className="ml-2">
                                    <span className="font-semibold block">{device.getName()}</span>
                                    <span className="text-xs text-subtle group-data-[state=checked]:text-alt">
                                        {device.getWidthWithUnits()} * {device.getHeightWithUnits()}
                                    </span>
                                </p>
                            </Menu.RadioItem>
                        ))}
                    </Menu.RadioGroup>
                </Menu.Content>
            </Menu.Portal>
        </Menu>
    );
};

PreviewToolbarEmulatorSelector.displayName = 'PreviewToolbarEmulatorSelector';
