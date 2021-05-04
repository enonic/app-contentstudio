import * as Q from 'q';
import {QueryExpr} from 'lib-admin-ui/query/expr/QueryExpr';
import {FieldExpr} from 'lib-admin-ui/query/expr/FieldExpr';
import {CompareExpr} from 'lib-admin-ui/query/expr/CompareExpr';
import {ValueExpr} from 'lib-admin-ui/query/expr/ValueExpr';
import {ContentQueryRequest} from '../resource/ContentQueryRequest';
import {ContentQueryResult} from '../resource/ContentQueryResult';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {Content} from '../content/Content';
import {ContentQuery} from '../content/ContentQuery';
import {QueryField} from 'lib-admin-ui/query/QueryField';
import {ContentSummary} from '../content/ContentSummary';
import {ContentId} from '../content/ContentId';
import {ContentSummaryJson} from '../content/ContentSummaryJson';

export class ContentHelper {

    static isReferencedBy(content: ContentSummary, reference: ContentId) {
        if (!content) {
            return Q(false);
        }

        const contentQuery: ContentQuery = new ContentQuery();
        contentQuery.setMustBeReferencedById(reference);
        contentQuery.setQueryExpr(
            new QueryExpr(CompareExpr.eq(new FieldExpr(QueryField.ID), ValueExpr.string(content.getContentId().toString()))));

        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery).sendAndParse().then(
            (contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                return contentQueryResult.getMetadata().getTotalHits() > 0;
            });
    }

    static containsChildContentId(content: Content, contentId: ContentId): Q.Promise<boolean> {
        const page = content.getPage();

        if (page) {
            if (page.doesFragmentContainId(contentId)) {
                return Q(true);
            }

            // return page.doRegionComponentsContainId(contentId);
            const fragments: ContentId[] = [];
            const containsId = page.getRegions() && page.doRegionsContainId(page.getRegions().getRegions(), contentId, fragments);
            if (!containsId && fragments.length > 0) {
                return Q.all(fragments.map(fragmentId => new GetContentByIdRequest(fragmentId).sendAndParse()))
                    .then((fragmentContents: Content[]) => {
                        return fragmentContents.some((fragmentContent: Content) => {
                            return fragmentContent.getPage().doesFragmentContainId(contentId);
                        });
                    });
            } else {
                return Q(containsId);
            }
        }

        return Q(false);
    }
}
