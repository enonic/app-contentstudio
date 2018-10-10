import ContentId = api.content.ContentId;
import ContentQuery = api.content.query.ContentQuery;
import QueryExpr = api.query.expr.QueryExpr;
import FieldExpr = api.query.expr.FieldExpr;
import CompareExpr = api.query.expr.CompareExpr;
import ValueExpr = api.query.expr.ValueExpr;
import ContentSummaryJson = api.content.json.ContentSummaryJson;
import ContentSummary = api.content.ContentSummary;
import {ContentQueryRequest} from '../resource/ContentQueryRequest';
import {ContentQueryResult} from '../resource/ContentQueryResult';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {Content} from '../content/Content';

export class ContentHelper {

    static isReferencedBy(content: ContentSummary, reference: ContentId) {
        if (!content) {
            return wemQ(false);
        }

        const contentQuery: ContentQuery = new ContentQuery();
        contentQuery.setMustBeReferencedById(reference);
        contentQuery.setQueryExpr(
            new QueryExpr(CompareExpr.eq(new FieldExpr(api.query.QueryField.ID), ValueExpr.string(content.getContentId().toString()))));

        return new ContentQueryRequest<ContentSummaryJson, ContentSummary>(contentQuery).sendAndParse().then(
            (contentQueryResult: ContentQueryResult<ContentSummary, ContentSummaryJson>) => {
                return contentQueryResult.getMetadata().getTotalHits() > 0;
            });
    }

    static containsChildContentId(content: Content, contentId: ContentId): wemQ.Promise<boolean> {
        const page = content.getPage();

        if (page) {
            if (page.doesFragmentContainId(contentId)) {
                return wemQ(true);
            }

            // return page.doRegionComponentsContainId(contentId);
            const fragments: ContentId[] = [];
            const containsId = page.getRegions() && page.doRegionsContainId(page.getRegions().getRegions(), contentId, fragments);
            if (!containsId && fragments.length > 0) {
                return wemQ.all(fragments.map(fragmentId => new GetContentByIdRequest(fragmentId).sendAndParse()))
                    .then((fragmentContents: Content[]) => {
                        return fragmentContents.some((fragmentContent: Content) => {
                            return fragmentContent.getPage().doesFragmentContainId(contentId);
                        });
                    });
            } else {
                return wemQ(containsId);
            }
        }

        return wemQ(false);
    }
}
