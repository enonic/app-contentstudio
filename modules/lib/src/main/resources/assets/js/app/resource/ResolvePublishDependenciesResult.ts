import {ResolvePublishContentResultJson} from './json/ResolvePublishContentResultJson';
import {ContentId} from '../content/ContentId';

export class ResolvePublishDependenciesResult {

    dependentContents: ContentId[];
    requestedContents: ContentId[];
    requiredContents: ContentId[];
    containsInvalid: boolean;
    allPublishable: boolean;
    allPendingDelete: boolean;
    invalidContents: ContentId[];
    notReadyContents: ContentId[];

    constructor(builder: Builder) {
        this.dependentContents = builder.dependentContents;
        this.requestedContents = builder.requestedContents;
        this.requiredContents = builder.requiredContents;
        this.containsInvalid = builder.containsInvalid;
        this.allPublishable = builder.allPublishable;
        this.allPendingDelete = builder.allPendingDelete;
        this.invalidContents = builder.invalidContents;
        this.notReadyContents = builder.notReadyContents;
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

    getInvalid(): ContentId[] {
        return this.invalidContents;
    }

    getInProgress(): ContentId[] {
        return this.notReadyContents;
    }

    static fromJson(json: ResolvePublishContentResultJson): ResolvePublishDependenciesResult {

        const dependants: ContentId[] = json.dependentContents
                                      ? json.dependentContents.map(dependant => new ContentId(dependant.id))
                                      : [];
        const requested: ContentId[] = json.requestedContents ? json.requestedContents.map(dependant => new ContentId(dependant.id)) : [];
        const required: ContentId[] = json.requiredContents ? json.requiredContents.map(dependant => new ContentId(dependant.id)) : [];
        const containsInvalid: boolean = json.containsInvalid;
        const allPublishable: boolean = json.allPublishable;
        const allPendingDelete: boolean = json.allPendingDelete;
        const invalidIds: ContentId[] = json.invalidContents ? json.invalidContents.map(dependant => new ContentId(dependant.id)) : [];
        const notReadyIds: ContentId[] = json.notReadyContents ? json.notReadyContents.map(dependant => new ContentId(dependant.id)) : [];

        return ResolvePublishDependenciesResult.create().setDependentContents(dependants).setRequestedContents(
            requested)
            .setRequiredContents(required)
            .setContainsInvalid(containsInvalid)
            .setAllPublishable(allPublishable)
            .setAllPendingDelete(allPendingDelete)
            .setInvalidContents(invalidIds)
            .setNotReadyContents(notReadyIds)
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
    invalidContents: ContentId[];
    notReadyContents: ContentId[];

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

    setInvalidContents(value: ContentId[]): Builder {
        this.invalidContents = value;
        return this;
    }

    setNotReadyContents(value: ContentId[]): Builder {
        this.notReadyContents = value;
        return this;
    }

    build(): ResolvePublishDependenciesResult {
        return new ResolvePublishDependenciesResult(this);
    }
}
