import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type ContentDependencyGroupJson} from '../../../../resource/json/ContentDependencyGroupJson';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {DependencyType} from '../../../../browse/DependencyType';

export class DependencyGroup
    implements Equitable {

    private readonly itemCount: number;

    private readonly iconUrl: string;

    private readonly contentType: ContentTypeName;

    private readonly type: DependencyType;

    constructor(builder: DependencyGroupBuilder) {
        this.itemCount = builder.itemCount;
        this.iconUrl = builder.iconUrl;
        this.contentType = builder.contentType;
        this.type = builder.type;
    }

    getItemCount(): number {
        return this.itemCount;
    }

    getIconUrl(): string {
        return this.iconUrl;
    }

    getContentType(): ContentTypeName {
        return this.contentType;
    }

    getName(): string {
        return this.contentType.toString();
    }

    getType(): DependencyType {
        return this.type;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, DependencyGroup)) {
            return false;
        }

        const other = o as DependencyGroup;

        if (!ObjectHelper.numberEquals(this.itemCount, other.itemCount)) {
            return false;
        }
        if (!ObjectHelper.equals(this.contentType, other.contentType)) {
            return false;
        }
        if (!ObjectHelper.stringEquals(DependencyType[this.type], DependencyType[other.type])) {
            return false;
        }

        return true;
    }

    static fromDependencyGroupJson(type: DependencyType, jsonItems: ContentDependencyGroupJson[]): DependencyGroup[] {
        const array: DependencyGroup[] = [];
        jsonItems.forEach((obj: ContentDependencyGroupJson) => {
            array.push(new DependencyGroupBuilder().fromJson(obj).setType(type).build());
        });
        return array;
    }

}

export class DependencyGroupBuilder {

    itemCount: number;

    iconUrl: string;

    contentType: ContentTypeName;

    type: DependencyType;

    constructor(source?: DependencyGroup) {
        if (source) {
            this.itemCount = source.getItemCount();
            this.iconUrl = source.getIconUrl();
            this.contentType = source.getContentType();
        }
    }

    fromJson(json: ContentDependencyGroupJson): DependencyGroupBuilder {
        this.itemCount = json.count;
        this.iconUrl = json.iconUrl;
        this.contentType = new ContentTypeName(json.type);

        return this;
    }

    setType(value: DependencyType): DependencyGroupBuilder {
        this.type = value;
        return this;
    }

    build(): DependencyGroup {
        return new DependencyGroup(this);
    }
}
