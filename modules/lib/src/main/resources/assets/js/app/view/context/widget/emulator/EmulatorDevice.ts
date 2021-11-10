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

    /* eslint-disable max-len */
    private static FULLSCREEN: EmulatorDevice;

    private static SMALL_PHONE: EmulatorDevice;

    private static MEDIUM_PHONE: EmulatorDevice;

    private static LARGE_PHONE: EmulatorDevice;

    private static TABLET: EmulatorDevice;

    private static NOTEBOOK_13: EmulatorDevice;

    private static NOTEBOOK_15: EmulatorDevice;

    private static HDTV: EmulatorDevice;

    private readonly name: string;

    private readonly deviceType: DeviceType;

    private readonly width: number;

    private readonly height: number;

    private readonly units: string;

    private readonly displayUnits: boolean;

    private readonly rotatable: boolean;

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
        function allEquals(tupleList: Array<String[] | DeviceType[] | number[] | boolean[]>): boolean {
            tupleList.forEach(function (tuple) {
                if (tuple[0] !== tuple[1]) {
                    return false;
                }
            });
            return true;
        }

        if (!ObjectHelper.iFrameSafeInstanceOf(o, EmulatorDevice)) {
            return false;
        }

        const other = <EmulatorDevice>o;

        const allValid = allEquals([
            [this.name, other.getName()],
            [this.deviceType, other.getDeviceType()],
            [this.width, other.getWidth()],
            [this.height, other.getHeight()],
            [this.units, other.getUnits()],
            [this.displayUnits, other.getDisplayUnits()],
            [this.rotatable, other.getRotatable()]
        ]);

        return allValid;
    }

    equalsBySize(width: number, height: number, units: string) {
        return this.width === width &&
               this.height === height &&
               this.units === units;
    }

    static getFullscreen(): EmulatorDevice {
        if (!EmulatorDevice.FULLSCREEN) {
            EmulatorDevice.FULLSCREEN = new EmulatorDevice(i18n('widget.emulator.device.fullsize'), DeviceType.MONITOR, 100, 100, '%',
                true, false);
        }

        return EmulatorDevice.FULLSCREEN;
    }

    static getSmallPhone(): EmulatorDevice {
        if (!EmulatorDevice.SMALL_PHONE) {
            EmulatorDevice.SMALL_PHONE = new EmulatorDevice(i18n('widget.emulator.device.smallphone'), DeviceType.MOBILE, 320, 480,
                'px',
                false, true);
        }

        return EmulatorDevice.SMALL_PHONE;
    }

    static getMediumPhone(): EmulatorDevice {
        if (!EmulatorDevice.MEDIUM_PHONE) {
            EmulatorDevice.MEDIUM_PHONE = new EmulatorDevice(i18n('widget.emulator.device.mediumphone'), DeviceType.MOBILE, 375, 667,
                'px',
                false, true);
        }

        return EmulatorDevice.MEDIUM_PHONE;
    }

    static getLargePhone(): EmulatorDevice {
        if (!EmulatorDevice.LARGE_PHONE) {
            EmulatorDevice.LARGE_PHONE = new EmulatorDevice(i18n('widget.emulator.device.largephone'), DeviceType.MOBILE, 414, 736,
                'px',
                false, true);
        }

        return EmulatorDevice.LARGE_PHONE;
    }

    static getTablet(): EmulatorDevice {
        if (!EmulatorDevice.TABLET) {
            EmulatorDevice.TABLET = new EmulatorDevice(i18n('widget.emulator.device.tablet'), DeviceType.TABLET, 768, 1024, 'px',
                false,
                true);
        }

        return EmulatorDevice.TABLET;
    }

    static getNotebook13(): EmulatorDevice {
        if (!EmulatorDevice.NOTEBOOK_13) {
            EmulatorDevice.NOTEBOOK_13 = new EmulatorDevice(i18n('widget.emulator.device.notebook13'), DeviceType.MONITOR, 1280, 800,
                'px',
                false, false);
        }

        return EmulatorDevice.NOTEBOOK_13;
    }

    static getNotebook15(): EmulatorDevice {
        if (!EmulatorDevice.NOTEBOOK_15) {
            EmulatorDevice.NOTEBOOK_15 = new EmulatorDevice(i18n('widget.emulator.device.notebook15'), DeviceType.MONITOR, 1366, 768,
                'px',
                false, false);
        }

        return EmulatorDevice.NOTEBOOK_15;
    }

    static getHDTV(): EmulatorDevice {
        if (!EmulatorDevice.HDTV) {
            EmulatorDevice.HDTV = new EmulatorDevice(i18n('widget.emulator.device.highDefinitionTV'), DeviceType.MONITOR, 1920, 1080,
                'px',
                false, false);
        }

        return EmulatorDevice.HDTV;
    }
}
