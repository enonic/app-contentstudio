import {EmulatorDevice} from '../view/context/widget/emulator/EmulatorDevice';

/**
 * @deprecated Replaced by EmulatedDeviceEvent
 */
export class EmulatedEvent {
    private readonly device: EmulatorDevice;

    private readonly emulator: boolean;

    constructor(device: EmulatorDevice, emulator: boolean = true) {
        this.device = device;
        this.emulator = emulator;
    }

    public getDevice(): EmulatorDevice {
        return this.device;
    }

    public getWidthWithUnits(): string {
        return this.device.getWidthWithUnits();
    }

    public getHeightWithUnits(): string {
        return this.device.getHeightWithUnits();
    }

    public isFullscreen(): boolean {
        const fullscreen = this.device.equals(EmulatorDevice.getFullscreen());
        const valid = this.device.isValid();
        return fullscreen || !valid;
    }

    public isEmulator(): boolean {
        return this.emulator;
    }
}
