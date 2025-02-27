import {EmulatedEvent} from '../../../../event/EmulatedEvent';

export class EmulatorContext {

    private static INSTANCE: EmulatorContext;

    private deviceChangedListeners: ((event: EmulatedEvent) => void)[];

    private constructor() {
        this.deviceChangedListeners = [];
    }

    static get(): EmulatorContext {
        if (!EmulatorContext.INSTANCE) {
            EmulatorContext.INSTANCE = new EmulatorContext();
        }

        return EmulatorContext.INSTANCE;
    }

    onDeviceChanged(listener: (event: EmulatedEvent) => void) {
        this.deviceChangedListeners.push(listener);
    }

    notifyDeviceChanged(event: EmulatedEvent) {
        this.deviceChangedListeners.forEach((listener: (event: EmulatedEvent) => void) => {
            listener(event);
        });

    }
}
