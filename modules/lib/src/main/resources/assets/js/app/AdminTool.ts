import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {DescriptorKey} from './page/DescriptorKey';
import {type AdminToolJson} from './resource/json/AdminToolJson';

export class AdminTool
    implements Equitable {

    private readonly key: DescriptorKey;

    private readonly uri: string;

    private readonly icon: string;

    private readonly displayName: string;

    private constructor(key: DescriptorKey, uri: string, icon: string, displayName: string) {
        this.key = key;
        this.uri = uri;
        this.icon = icon;
        this.displayName = displayName;
    }

    public static fromJSON(json: AdminToolJson): AdminTool {
        return new AdminTool(DescriptorKey.fromString(json.key), json.uri, json.icon, json.displayName);
    }

    getKey(): DescriptorKey {
        return this.key;
    }

    getUri(): string {
        return this.uri;
    }

    getIcon(): string {
        return this.icon;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, AdminTool)) {
            return false;
        }

        const other = o as AdminTool;

        if (!ObjectHelper.stringEquals(this.uri, other.uri)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.icon, other.icon)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.displayName, other.displayName)) {
            return false;
        }

        return ObjectHelper.equals(this.key, other.key);
    }
}
