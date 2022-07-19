import * as Q from 'q';
import {GetContentVersionsRequest} from '../../../../resource/GetContentVersionsRequest';
import {ContentVersions} from '../../../../ContentVersions';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';

export class ContentVersionsLoader {

    load(content: ContentSummaryAndCompareStatus): Q.Promise<ContentVersions> {
        if (!content?.getContentId()) {
            throw new Error('Required contentId not set for ActiveContentVersionsTreeGrid');
        }

        return new GetContentVersionsRequest(content.getContentId()).sendAndParse();
    }
}
