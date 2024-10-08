import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ComponentName} from './ComponentName';

export abstract class ComponentType {

    private static shortNameToInstance: Record<string, ComponentType> = {};

    private shortName: string;

    constructor(shortName: string) {
        ComponentType.shortNameToInstance[shortName] = this;
        this.shortName = shortName;
    }

    getShortName(): string {
        return this.shortName;
    }

    static byShortName(shortName: string): ComponentType {
        return ComponentType.shortNameToInstance[shortName];
    }

    getDefaultName(): ComponentName {
        return new ComponentName(StringHelper.capitalize(StringHelper.removeWhitespaces(this.shortName)));
    }

    getIconCls(): string {
        return '';
    }

    toString(): string {
        return this.shortName;
    }
}
