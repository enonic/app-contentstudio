import Q from 'q';
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
import {PageHelper} from './PageHelper';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {Form} from '@enonic/lib-admin-ui/form/Form';
import {FormItemParent} from '@enonic/lib-admin-ui/form/FormItem';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {Permission} from '../access/Permission';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {AccessControlList} from '../access/AccessControlList';


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
            if (PageHelper.doesFragmentContainId(page.getFragment(), contentId)) {
                return Q(true);
            }

            // return page.doRegionComponentsContainId(contentId);
            const fragments: ContentId[] = [];
            const containsId = page.getRegions() && PageHelper.doRegionsContainId(page.getRegions().getRegions(), contentId, fragments);
            if (!containsId && fragments.length > 0) {
                return Q.all(fragments.map(fragmentId => new GetContentByIdRequest(fragmentId).sendAndParse()))
                    .then((fragmentContents: Content[]) => {
                        return fragmentContents.some((fragmentContent: Content) => {
                            return PageHelper.doesFragmentContainId(fragmentContent.getPage().getFragment(), contentId);
                        });
                    });
            } else {
                return Q(containsId);
            }
        }

        return Q(false);
    }

    static makeNewContentRequest(type: ContentTypeName): CreateContentRequest {
        return new CreateContentRequest()
            .setName(ContentUnnamed.newUnnamed())
            .setContentType(type)
            .setDisplayName('')     // new content is created on wizard open so display name is always empty
            .setData(new PropertyTree())
            .setMixins([])
            .setWorkflow(Workflow.create().setState(WorkflowState.IN_PROGRESS).build());
    }

    // update to return list of components that contain id, and reload only them
    static doContentComponentsContainId(content: Content, form: Form, contentId: ContentId): Q.Promise<boolean> {
        const page = content.getPage();

        if (page) {
            const data: PropertyTree = content.getContentData();

            if (ContentHelper.doHtmlAreasContainId(contentId.toString(), form, data)) {
                return Q(true);
            }

            return ContentHelper.containsChildContentId(content, contentId);
        }

        return Q(false);
    }

    static doHtmlAreasContainId(id: string, form: Form, data: PropertyTree): boolean {
        let areas = this.getHtmlAreasInForm(form);

        return areas.some((area) => {
            let property = data.getProperty(area);
            if (property && property.hasNonNullValue() && property.getType().equals(ValueTypes.STRING)) {
                return property.getString().indexOf(id) >= 0;
            }
        });
    }

    private static getHtmlAreasInForm(formItemContainer: Form | FormItemParent): string[] {
        let result: string[] = [];

        formItemContainer.getFormItems().forEach((item: FormItemParent | Input) => {
            if (ObjectHelper.iFrameSafeInstanceOf(item, Input)) {
                const input = item as Input;
                if (input.getInputType().getName() === 'HtmlArea') {
                    result.push(input.getPath().toString());
                }
            } else {
                result = result.concat(this.getHtmlAreasInForm(item as FormItemParent));
            }
        });

        return result;
    }

    public static isAnyPrincipalAllowed(permissions: AccessControlList, principalKeys: PrincipalKey[], permission: Permission): boolean {
        if (principalKeys.some(key => RoleKeys.isAdmin(key))) {
            return true;
        }

        const permissionEntries = permissions.getEntries();
        for (const permissionEntry of permissionEntries) {
            if (permissionEntry.isAllowed(permission)) {
                const principalInEntry = principalKeys.some((principalKey: PrincipalKey) => {
                    if (principalKey.equals(permissionEntry.getPrincipalKey())) {
                        return true;
                    }
                });
                if (principalInEntry) {
                    return true;
                }
            }
        }
        return false;
    }
}
