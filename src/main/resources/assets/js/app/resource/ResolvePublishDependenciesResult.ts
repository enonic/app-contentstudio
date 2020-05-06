import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ResolvePublishContentResultJson} from './json/ResolvePublishContentResultJson';

export class ResolvePublishDependenciesResult {

    dependentContents: ContentId[];
    requestedContents: ContentId[];
    requiredContents: ContentId[];
    containsInvalid: boolean;
    allPublishable: boolean;
    allPendingDelete: boolean;

    constructor(builder: Builder) {
        this.dependentContents = builder.dependentContents;
        this.requestedContents = builder.requestedContents;
        this.requiredContents = builder.requiredContents;
        this.containsInvalid = builder.containsInvalid;
        this.allPublishable = builder.allPublishable;
        this.allPendingDelete = builder.allPendingDelete;
    }

    getDependants(): ContentId[] {
        return this.dependentContents;
    }

    getRequested(): ContentId[] {
        return this.requestedContents;
    }

    getRequired(): ContentId[] {
        return this.requiredContents;
    }

    isContainsInvalid(): boolean {
        return this.containsInvalid;
    }

    isAllPublishable(): boolean {
        return this.allPublishable;
    }

    isAllPendingDelete(): boolean {
        return this.allPendingDelete;
    }

    static fromJson(json: ResolvePublishContentResultJson): ResolvePublishDependenciesResult {

        let dependants: ContentId[] = json.dependentContents
                                      ? json.dependentContents.map(dependant => new ContentId(dependant.id))
                                      : [];
        let requested: ContentId[] = json.requestedContents ? json.requestedContents.map(dependant => new ContentId(dependant.id)) : [];
        let required: ContentId[] = json.requiredContents ? json.requiredContents.map(dependant => new ContentId(dependant.id)) : [];
        let containsInvalid: boolean = json.containsInvalid;
        let allPublishable: boolean = json.allPublishable;
        let allPendingDelete: boolean = json.allPendingDelete;

        return ResolvePublishDependenciesResult.create().setDependentContents(dependants).setRequestedContents(
            requested)
            .setRequiredContents(required)
            .setContainsInvalid(containsInvalid)
            .setAllPublishable(allPublishable)
            .setAllPendingDelete(allPendingDelete)
            .build();
    }

    static create(): Builder {
        return new Builder();
    }
}

export class Builder {
    dependentContents: ContentId[];
    requestedContents: ContentId[];
    requiredContents: ContentId[];
    containsInvalid: boolean;
    allPublishable: boolean;
    allPendingDelete: boolean;

    setDependentContents(value: ContentId[]): Builder {
        this.dependentContents = value;
        return this;
    }

    setRequestedContents(value: ContentId[]): Builder {
        this.requestedContents = value;
        return this;
    }

    setRequiredContents(value: ContentId[]): Builder {
        this.requiredContents = value;
        return this;
    }

    setContainsInvalid(value: boolean): Builder {
        this.containsInvalid = value;
        return this;
    }

    setAllPublishable(value: boolean): Builder {
        this.allPublishable = value;
        return this;
    }

    setAllPendingDelete(value: boolean): Builder {
        this.allPendingDelete = value;
        return this;
    }

    build(): ResolvePublishDependenciesResult {
        return new ResolvePublishDependenciesResult(this);
    }
}
