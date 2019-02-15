import {EmulatorDevice} from '../view/context/widget/emulator/EmulatorDevice';

export class EmulatedEvent
    extends api.event.Event {

    private device: EmulatorDevice;

    private emulator: boolean;

    constructor(device: EmulatorDevice, emulator: boolean = true) {
        super();
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
        const fullscreen = this.device.equals(EmulatorDevice.FULLSCREEN);
        const valid = this.device.isValid();
        return fullscreen || !valid;
    }

    public isEmulator(): boolean {
        return this.emulator;
    }

    static on(handler: (event: EmulatedEvent) => void) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EmulatedEvent) => void) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
    }

}
