import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type GetPublishStatusResultJson} from './json/GetPublishStatusResultJson';
import {PublishStatus} from '../publish/PublishStatus';

export class GetPublishStatusResult
    implements Equitable {

    publishStatus: PublishStatus;

    id: string;

    constructor(id: string, publishStatus: PublishStatus) {

        this.publishStatus = publishStatus;
        this.id = id;
    }

    getId(): string {
        return this.id;
    }

    getPublishStatus(): PublishStatus {
        return this.publishStatus;
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, GetPublishStatusResult)) {
            return false;
        }

        const other = o as GetPublishStatusResult;

        if (!ObjectHelper.stringEquals(this.id.toString(), other.id.toString())) {
            return false;
        }

        if (!ObjectHelper.objectEquals(this.publishStatus, other.publishStatus)) {
            return false;
        }

        return true;
    }

    static fromJson(json: GetPublishStatusResultJson): GetPublishStatusResult {

        const status: PublishStatus = PublishStatus[json.publishStatus] as PublishStatus;

        return new GetPublishStatusResult(json.id, status);
    }
}
