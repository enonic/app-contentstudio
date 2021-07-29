import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {DescriptorKey} from './page/DescriptorKey';
import {AdminToolJson} from './resource/json/AdminToolJson';

export class AdminTool
    implements Equitable {

    private readonly key: DescriptorKey;

    private readonly uri: string;

    private readonly icon: string;

    private constructor(key: DescriptorKey, uri: string, icon: string) {
        this.key = key;
        this.uri = uri;
        this.icon = icon;
    }

    public static fromJSON(json: AdminToolJson): AdminTool {
        return new AdminTool(DescriptorKey.fromString(json.key), json.uri, json.icon);
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

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, AdminTool)) {
            return false;
        }

        const other = <AdminTool>o;

        if (!ObjectHelper.stringEquals(this.uri, other.uri)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.icon, other.icon)) {
            return false;
        }

        return ObjectHelper.equals(this.key, other.key);
    }
}
