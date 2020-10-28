import {i18n} from 'lib-admin-ui/util/Messages';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {Equitable} from 'lib-admin-ui/Equitable';

export enum DeviceType {
    MONITOR,
    TABLET,
    MOBILE
}

export class EmulatorDevice
    implements Equitable {

    // tslint:disable max-line-length
    public static FULLSCREEN: EmulatorDevice = new EmulatorDevice(i18n('widget.emulator.device.fullsize'), DeviceType.MONITOR, 100, 100, '%',
        true, false);
    public static SMALL_PHONE: EmulatorDevice = new EmulatorDevice(i18n('widget.emulator.device.smallphone'), DeviceType.MOBILE, 320, 480, 'px',
        false, true);
    public static MEDIUM_PHONE: EmulatorDevice = new EmulatorDevice(i18n('widget.emulator.device.mediumphone'), DeviceType.MOBILE, 375, 667, 'px',
        false, true);
    public static LARGE_PHONE: EmulatorDevice = new EmulatorDevice(i18n('widget.emulator.device.largephone'), DeviceType.MOBILE, 414, 736, 'px',
        false, true);
    public static TABLET: EmulatorDevice = new EmulatorDevice(i18n('widget.emulator.device.tablet'), DeviceType.TABLET, 768, 1024, 'px', false,
        true);
    public static NOTEBOOK_13: EmulatorDevice = new EmulatorDevice(i18n('widget.emulator.device.notebook13'), DeviceType.MONITOR, 1280, 800, 'px',
        false, false);
    public static NOTEBOOK_15: EmulatorDevice = new EmulatorDevice(i18n('widget.emulator.device.notebook15'), DeviceType.MONITOR, 1366, 768, 'px',
        false, false);
    public static HDTV: EmulatorDevice = new EmulatorDevice(i18n('widget.emulator.device.highDefinitionTV'), DeviceType.MONITOR, 1920, 1080, 'px',
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
        return this.width > 0 && this.height > 0 && !StringHelper.isBlank(this.units);
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, EmulatorDevice)) {
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
