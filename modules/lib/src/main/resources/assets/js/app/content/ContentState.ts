export enum ContentStateEnum {
    PENDING_DELETE,
    DEFAULT
}

export class ContentState {

    private readonly state: ContentStateEnum;

    constructor(state: ContentStateEnum = ContentStateEnum.DEFAULT) {
        this.state = state;
    }

    static fromString(value: string): ContentState {
        if (value === ContentStateEnum[ContentStateEnum.PENDING_DELETE]) {
            return new ContentState(ContentStateEnum.PENDING_DELETE);
        } else {
            return new ContentState(ContentStateEnum.DEFAULT);
        }
    }

    getState(): ContentStateEnum {
        return this.state;
    }

    getStateAsString(): string {
        return ContentStateEnum[this.state];
    }

    isDefault(): boolean {
        return this.state === ContentStateEnum.DEFAULT;
    }
}
