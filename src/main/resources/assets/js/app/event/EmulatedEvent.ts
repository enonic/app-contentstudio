export class EmulatedEvent
    extends api.event.Event {

    private width: number;

    private height: number;

    private units: string;

    constructor(width: number = 0, height: number = 0, units: string = 'px') {
        super();
        this.width = width;
        this.height = height;
        this.units = units;
    }

    public getWidth(): number {
        return this.width;
    }

    public getWidthWithUnits(): string {
        return `${this.width}${this.units}`;
    }

    public getHeight(): number {
        return this.height;
    }

    public getHeightWithUnits(): string {
        return `${this.height}${this.units}`;
    }

    public getUnits(): string {
        return this.units;
    }

    public isPixelUnits(): boolean {
        return this.units === 'px';
    }

    public isFullscreen(): boolean {
        const fullscreen = this.width === 100 && this.height === 100 && this.isPixelUnits();
        const valid = this.width > 0 && this.height > 0 && !api.util.StringHelper.isBlank(this.units);
        return fullscreen || !valid;
    }

    static on(handler: (event: EmulatedEvent) => void) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EmulatedEvent) => void) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
    }

}
