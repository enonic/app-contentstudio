import i18n = api.util.i18n;

export enum DeviceType {
    MONITOR,
    TABLET,
    MOBILE
}

export class EmulatorDevice
    implements api.Equitable {

    // tslint:disable max-line-length
    public static FULLSCREEN: EmulatorDevice = new EmulatorDevice(i18n('live.view.device.fullsize'), DeviceType.MONITOR, 100, 100, '%',
        true, false);
    public static SMALL_PHONE: EmulatorDevice = new EmulatorDevice(i18n('live.view.device.smallphone'), DeviceType.MOBILE, 320, 480, 'px',
        false, true);
    public static MEDIUM_PHONE: EmulatorDevice = new EmulatorDevice(i18n('live.view.device.mediumphone'), DeviceType.MOBILE, 375, 667, 'px',
        false, true);
    public static LARGE_PHONE: EmulatorDevice = new EmulatorDevice(i18n('live.view.device.largephone'), DeviceType.MOBILE, 414, 736, 'px',
        false, true);
    public static TABDLET: EmulatorDevice = new EmulatorDevice(i18n('live.view.device.tablet'), DeviceType.TABLET, 768, 1024, 'px', false,
        true);
    public static NOTEBOOK_13: EmulatorDevice = new EmulatorDevice(i18n('live.view.device.notebook13'), DeviceType.MONITOR, 1280, 800, 'px',
        false, false);
    public static NOTEBOOK_15: EmulatorDevice = new EmulatorDevice(i18n('live.view.device.notebook15'), DeviceType.MONITOR, 1366, 768, 'px',
        false, false);
    public static HDTV: EmulatorDevice = new EmulatorDevice(i18n('live.view.device.highDefinitionTV'), DeviceType.MONITOR, 1920, 1080, 'px',
        false, false);
    // tslint:enable

    private name: string;

    private deviceType: DeviceType;

    private width: number;

    private height: number;

    private units: string;

    private displayUnits: boolean;

    private rotatable: boolean;

    constructor(name: string, type: DeviceType, width: number, height: number, units: string, displayUnits: boolean, rotatable: boolean) {
        this.name = name;
        this.deviceType = type;
        this.width = width;
        this.height = height;
        this.units = units;
        this.displayUnits = displayUnits;
        this.rotatable = rotatable;
    }

    getName(): string {
        return this.name;
    }

    getDeviceType(): DeviceType {
        return this.deviceType;
    }

    getDeviceTypeAsString(): string {
        return DeviceType[this.deviceType].toLowerCase();
    }

    getWidth(): number {
        return this.width;
    }

    public getWidthWithUnits(): string {
        return `${this.width}${this.units}`;
    }

    getHeight(): number {
        return this.height;
    }

    public getHeightWithUnits(): string {
        return `${this.height}${this.units}`;
    }

    getUnits(): string {
        return this.units;
    }

    getDisplayUnits(): boolean {
        return this.displayUnits;
    }

    getRotatable(): boolean {
        return this.rotatable;
    }

    isValid(): boolean {
        return this.width > 0 && this.height > 0 && !api.util.StringHelper.isBlank(this.units);
    }

    equals(o: api.Equitable): boolean {
        if (!api.ObjectHelper.iFrameSafeInstanceOf(o, EmulatorDevice)) {
            return false;
        }

        let other = <EmulatorDevice> o;

        return this.name === other.getName() &&
               this.deviceType === other.getDeviceType() &&
               this.width === other.getWidth() &&
               this.height === other.getHeight() &&
               this.units === other.getUnits() &&
               this.displayUnits === other.getDisplayUnits() &&
               this.rotatable === other.getRotatable();
    }

    equalsBySize(width: number, height: number, units: string) {
        return this.width === width &&
               this.height === height &&
               this.units === units;
    }
}
