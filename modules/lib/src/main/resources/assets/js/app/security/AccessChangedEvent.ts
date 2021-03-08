import {Access} from './Access';

export class AccessChangedEvent {

    private oldValue: Access;

    private newValue: Access;

    constructor(oldValue: Access = Access.READ, newValue: Access = Access.READ) {
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    getOldValue(): Access {
        return this.oldValue;
    }

    getNewValue(): Access {
        return this.newValue;
    }

    valuesAreEqual(): boolean {
        return this.oldValue === this.newValue;
    }
}
