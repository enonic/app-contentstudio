import Q from 'q';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {GetContentVersionsRequest} from '../../../../resource/GetContentVersionsRequest';
import {GetContentVersionsResult} from '../../../../resource/GetContentVersionsResult';

export class ContentVersionsLoader {

    load(content: ContentSummaryAndCompareStatus): Q.Promise<GetContentVersionsResult> {
        if (!content?.getContentId()) {
            throw new Error('Required contentId not set for ActiveContentVersionsTreeGrid');
        }

        return new GetContentVersionsRequest(content.getContentId()).sendAndParse();
    }
}
