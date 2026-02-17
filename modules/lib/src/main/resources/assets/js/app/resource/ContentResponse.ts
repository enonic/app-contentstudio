import {type ResultMetadata} from './ResultMetadata';

export class ContentResponse<T> {

    private contents: T[];

    private metadata: ResultMetadata;

    constructor(contents: T[], metadata: ResultMetadata) {
        this.contents = contents;
        this.metadata = metadata;
    }

    getContents(): T[] {
        return this.contents;
    }

    getMetadata(): ResultMetadata {
        return this.metadata;
    }

    setContents(contents: T[]): ContentResponse<T> {
        this.contents = contents;
        return this;
    }

    setMetadata(metadata: ResultMetadata): ContentResponse<T> {
        this.metadata = metadata;
        return this;
    }
}
