import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type ResultMetadataJson} from './json/ResultMetadataJson';

export class ResultMetadata
    implements Equitable {

    private hits: number;

    private totalHits: number;

    constructor(hits: number, totalHits: number) {
        this.hits = hits;
        this.totalHits = totalHits;
    }

    static fromJson(json: ResultMetadataJson): ResultMetadata {
        return new ResultMetadata(json.hits, json.totalHits);
    }

    getHits(): number {
        return this.hits;
    }

    getTotalHits(): number {
        return this.totalHits;
    }

    setHits(hits: number) {
        this.hits = hits;
    }

    setTotalHits(totalHits: number) {
        this.totalHits = totalHits;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ResultMetadata)) {
            return false;
        }

        const other = o as ResultMetadata;

        if (this.hits !== other.hits ||
            this.totalHits !== other.totalHits) {

            return false;
        }

        return true;
    }
}
