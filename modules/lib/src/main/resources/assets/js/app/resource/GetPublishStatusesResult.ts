import {GetPublishStatusResult} from './GetPublishStatusResult';
import {type GetPublishStatusResultJson} from './json/GetPublishStatusResultJson';
import {type GetPublishStatusesResultJson} from './json/GetPublishStatusesResultJson';

export class GetPublishStatusesResult {

    private getPublishStatusesResult: GetPublishStatusResult[] = [];

    constructor(getPublishStatusesResult: GetPublishStatusResult[]) {
        this.getPublishStatusesResult = getPublishStatusesResult;
    }

    get(contentId: string): GetPublishStatusResult {

        let getPublishStatusResult: GetPublishStatusResult = null;

        this.getPublishStatusesResult.forEach((result: GetPublishStatusResult) => {

            if (result.getId() === contentId) {
                getPublishStatusResult = result;
            }
        });

        return getPublishStatusResult;
    }

    getAll(): GetPublishStatusResult[] {
        return this.getPublishStatusesResult;
    }

    static fromJson(json: GetPublishStatusesResultJson): GetPublishStatusesResult {

        const list: GetPublishStatusResult[] = [];

        json.publishStatuses.forEach((getPublishStatusResult: GetPublishStatusResultJson) => {
            list.push(GetPublishStatusResult.fromJson(getPublishStatusResult));
        });

        return new GetPublishStatusesResult(list);
    }
}
