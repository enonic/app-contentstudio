import {ContentId} from '../content/ContentId';
import {ResolvePublishContentResultJson} from './json/ResolvePublishContentResultJson';

export class ResolvePublishDependenciesResult {

    dependentContents: ContentId[];
    requestedContents: ContentId[];
    requiredContents: ContentId[];
    containsInvalid: boolean;
    notPublishableContents: ContentId[];
    somePublishable: boolean;
    invalidContents: ContentId[];
    notReadyContents: ContentId[];
    nextDependentContents: ContentId[];
    notFoundOutboundContents: ContentId[];

    constructor(builder: Builder) {
        this.dependentContents = builder.dependentContents;
        this.requestedContents = builder.requestedContents;
        this.requiredContents = builder.requiredContents;
        this.containsInvalid = builder.containsInvalid;
        this.notPublishableContents = builder.notPublishableContents;
        this.somePublishable = builder.somePublishable;
        this.invalidContents = builder.invalidContents;
        this.notReadyContents = builder.notReadyContents;
        this.nextDependentContents = builder.nextDependentContents;
        this.notFoundOutboundContents = builder.notFoundOutboundContents;
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

    getNotPublishable(): ContentId[] {
        return this.notPublishableContents;
    }

    isSomePublishable(): boolean {
        return this.somePublishable;
    }

    getInvalid(): ContentId[] {
        return this.invalidContents;
    }

    getInProgress(): ContentId[] {
        return this.notReadyContents;
    }

    getNextDependants(): ContentId[] {
        return this.nextDependentContents;
    }

    getNotFoundOutboundContents(): ContentId[] {
        return this.notFoundOutboundContents;
    }

    static fromJson(json: ResolvePublishContentResultJson): ResolvePublishDependenciesResult {

        const dependants: ContentId[] = json.dependentContents
                                        ? json.dependentContents.map(dependant => new ContentId(dependant.id))
                                        : [];
        const requested: ContentId[] = json.requestedContents?.map(dependant => new ContentId(dependant.id)) ?? [];
        const required: ContentId[] = json.requiredContents?.map(dependant => new ContentId(dependant.id)) ?? [];
        const containsInvalid: boolean = json.containsInvalid;
        const notPublishableIds: ContentId[] = json.notPublishableContents?.map(dependant => new ContentId(dependant.id)) ?? [];
        const somePublishable: boolean = json.somePublishable;
        const invalidIds: ContentId[] = json.invalidContents?.map(dependant => new ContentId(dependant.id)) ?? [];
        const notReadyIds: ContentId[] = json.notReadyContents?.map(dependant => new ContentId(dependant.id)) ?? [];
        const nextDependentContents: ContentId[] = json.nextDependentContents?.map(dependant => new ContentId(dependant.id)) ?? [];
        const notFoundOutboundContents: ContentId[] = json.notFoundOutboundContents?.map(dependant => new ContentId(dependant.id)) ?? [];

        return ResolvePublishDependenciesResult.create().setDependentContents(dependants).setRequestedContents(
            requested)
            .setRequiredContents(required)
            .setContainsInvalid(containsInvalid)
            .setNotPublishableContents(notPublishableIds)
            .setSomePublishable(somePublishable)
            .setInvalidContents(invalidIds)
            .setNotReadyContents(notReadyIds)
            .setNextDependentContents(nextDependentContents)
            .setNotFoundOutboundContents(notFoundOutboundContents)
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
    notPublishableContents: ContentId[];
    somePublishable: boolean;
    invalidContents: ContentId[];
    notReadyContents: ContentId[];
    nextDependentContents: ContentId[];
    notFoundOutboundContents: ContentId[];

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

    setNotPublishableContents(notPublishableContents: ContentId[]): Builder {
        this.notPublishableContents = notPublishableContents;
        return this;
    }

    setSomePublishable(value: boolean): Builder {
        this.somePublishable = value;
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

    setNextDependentContents(value: ContentId[]): Builder {
        this.nextDependentContents = value;
        return this;
    }

    setNotFoundOutboundContents(value: ContentId[]): Builder {
        this.notFoundOutboundContents = value;
        return this;
    }

    build(): ResolvePublishDependenciesResult {
        return new ResolvePublishDependenciesResult(this);
    }
}
