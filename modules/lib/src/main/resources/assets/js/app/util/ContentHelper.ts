import * as Q from 'q';
import {QueryExpr} from '@enonic/lib-admin-ui/query/expr/QueryExpr';
import {FieldExpr} from '@enonic/lib-admin-ui/query/expr/FieldExpr';
import {CompareExpr} from '@enonic/lib-admin-ui/query/expr/CompareExpr';
import {ValueExpr} from '@enonic/lib-admin-ui/query/expr/ValueExpr';
import {ContentQueryRequest} from '../resource/ContentQueryRequest';
import {ContentQueryResult} from '../resource/ContentQueryResult';
import {GetContentByIdRequest} from '../resource/GetContentByIdRequest';
import {Content} from '../content/Content';
import {ContentQuery} from '../content/ContentQuery';
import {QueryField} from '@enonic/lib-admin-ui/query/QueryField';
import {ContentSummary} from '../content/ContentSummary';
import {ContentId} from '../content/ContentId';
import {ContentSummaryJson} from '../content/ContentSummaryJson';
import {CreateContentRequest} from '../resource/CreateContentRequest';
import {ContentUnnamed} from '../content/ContentUnnamed';
import {Workflow} from '../content/Workflow';
import {WorkflowState} from '../content/WorkflowState';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentPath} from '../content/ContentPath';

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

    static makeNewContentRequest(type: ContentTypeName, parentPath?: ContentPath, requiredValid?: boolean): CreateContentRequest {
        return new CreateContentRequest()
            .setRequireValid(requiredValid)
            .setName(ContentUnnamed.newUnnamed())
            .setParent(parentPath)
            .setContentType(type)
            .setDisplayName('')     // new content is created on wizard open so display name is always empty
            .setData(new PropertyTree())
            .setExtraData([])
            .setWorkflow(Workflow.create().setState(WorkflowState.IN_PROGRESS).build());
    }
}
