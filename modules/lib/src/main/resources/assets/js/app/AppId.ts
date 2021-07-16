import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';

export class AppId implements Equitable {

    private readonly id: string;

    constructor(id: string) {
        this.id = id;
    }

    getId(): string {
        return this.id;
    }

    equals(other: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(other, AppId)) {
            return false;
        }

        const o: AppId = <AppId> other;

        return this.id === o.id;
    }
}
