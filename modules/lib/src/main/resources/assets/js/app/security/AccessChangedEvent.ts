export class AccessChangedEvent {

    private readonly oldValue: string;

    private readonly newValue: string;

    constructor(oldValue: string, newValue: string) {
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    getOldValue(): string {
        return this.oldValue;
    }

    getNewValue(): string {
        return this.newValue;
    }

    valuesAreEqual(): boolean {
        return this.oldValue === this.newValue;
    }
}
