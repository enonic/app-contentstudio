import {ContentId} from '../content/ContentId';
import {type FindIdsByParentsResultJson} from './json/FindIdsByParentsResultJson';

export class FindIdsByParentsResult {

    ids: ContentId[];

    constructor(builder: Builder) {
        this.ids = builder.ids;
    }

    getIds(): ContentId[] {
        return this.ids;
    }

    static fromJson(json: FindIdsByParentsResultJson): FindIdsByParentsResult {
        const dependants: ContentId[] = json.ids?.map(dependant => new ContentId(dependant.id)) ?? [];
        return FindIdsByParentsResult.create().setDependentContents(dependants).build();
    }

    static create(): Builder {
        return new Builder();
    }
}

export class Builder {
    ids: ContentId[];

    setDependentContents(value: ContentId[]): Builder {
        this.ids = value;
        return this;
    }

    build(): FindIdsByParentsResult {
        return new FindIdsByParentsResult(this);
    }
}
