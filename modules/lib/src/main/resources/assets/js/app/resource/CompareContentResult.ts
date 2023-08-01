import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {CompareContentResultJson} from './json/CompareContentResultJson';
import {CompareStatus} from '../content/CompareStatus';
import {PublishStatus} from '../publish/PublishStatus';

export class CompareContentResult
    implements Equitable {

    compareStatus: CompareStatus;

    id: string;

    publishStatus: PublishStatus;

    constructor(id: string, compareStatus: CompareStatus, publishStatus: PublishStatus) {

        this.compareStatus = compareStatus;
        this.id = id;
        this.publishStatus = publishStatus;
    }

    getId(): string {
        return this.id;
    }

    getCompareStatus(): CompareStatus {
        return this.compareStatus;
    }

    getPublishStatus(): PublishStatus {
        return this.publishStatus;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, CompareContentResult)) {
            return false;
        }

        let other = o as CompareContentResult;

        if (!ObjectHelper.stringEquals(this.id.toString(), other.id.toString())) {
            return false;
        }

        return true;
    }

    static fromJson(json: CompareContentResultJson): CompareContentResult {

        let compareStatus: CompareStatus = CompareStatus[json.compareStatus] as CompareStatus;
        let publishStatus: PublishStatus = PublishStatus[json.publishStatus] as PublishStatus;

        return new CompareContentResult(json.id, compareStatus, publishStatus);
    }
}
