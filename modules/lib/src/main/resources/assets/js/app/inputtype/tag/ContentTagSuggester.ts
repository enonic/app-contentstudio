import Q from 'q';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {QueryExpr} from '@enonic/lib-admin-ui/query/expr/QueryExpr';
import {type PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {type Property} from '@enonic/lib-admin-ui/data/Property';
import {type TagSuggester} from '../ui/tag/TagSuggester';
import {type Content} from '../../content/Content';
import {type ContentJson} from '../../content/ContentJson';
import {ContentSelectorQueryRequest} from '../../resource/ContentSelectorQueryRequest';
import {GetNearestSiteRequest} from '../../resource/GetNearestSiteRequest';
import {type Site} from '../../content/Site';
import {type Expression} from '@enonic/lib-admin-ui/query/expr/Expression';
import {FulltextSearchExpressionBuilder} from '@enonic/lib-admin-ui/query/FulltextSearchExpression';
import {QueryField} from '@enonic/lib-admin-ui/query/QueryField';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {type ContentSummary} from '../../content/ContentSummary';

export class ContentTagSuggesterBuilder {

    dataPath: PropertyPath;

    content: ContentSummary;

    allowedPaths: string[];

    setDataPath(value: PropertyPath): ContentTagSuggesterBuilder {
        this.dataPath = value;
        return this;
    }

    setContent(content: ContentSummary): ContentTagSuggesterBuilder {
        this.content = content;
        return this;
    }

    setAllowedContentPaths(paths: string[]): ContentTagSuggesterBuilder {
        this.allowedPaths = paths;
        return this;
    }

    build(): ContentTagSuggester {
        return new ContentTagSuggester(this);
    }
}

export class ContentTagSuggester
    implements TagSuggester {

    static SITE_PATH: string = '${site}/*';

    private propertyPath: PropertyPath;

    private content: ContentSummary;

    private allowedPaths: string[] = [];

    constructor(builder: ContentTagSuggesterBuilder) {
        this.propertyPath = builder.dataPath;
        this.content = builder.content;
        this.allowedPaths = builder.allowedPaths;
    }

    suggest(searchString: string): Q.Promise<string[]> {

        const fieldName = 'data' + this.propertyPath.getParentPath().toString() + this.propertyPath.getLastElement().getName();

        const fulltextExpression: Expression = new FulltextSearchExpressionBuilder()
            .setSearchString(searchString)
            .addField(new QueryField(fieldName))
            .build();

        const queryExpr: QueryExpr = new QueryExpr(fulltextExpression);

        return this.checkAndFindTags(searchString, queryExpr);
    }

    private checkAndFindTags(searchString: string, queryExpr: QueryExpr): Q.Promise<string[]> {
        const restrictedToSite = ObjectHelper.anyArrayEquals([ContentTagSuggester.SITE_PATH], this.allowedPaths);

        return (restrictedToSite ? this.hasNearestSite() : Q(true)).then((canFind: boolean) => {
            return canFind ? this.findTags(searchString, queryExpr) : Q([]);
        });
    }

    private hasNearestSite(): Q.Promise<boolean> {
        return new GetNearestSiteRequest(this.content.getContentId()).sendAndParse().then((site: Site) => !!site);
    }

    private findTags(searchString: string, queryExpr: QueryExpr): Q.Promise<string[]> {
        const request = new ContentSelectorQueryRequest<ContentJson, Content>();

        request.setSize(10);
        request.setContent(this.content);
        request.setExpand(Expand.FULL);
        request.setAllowedContentPaths(this.allowedPaths || []);

        request.setQueryExpr(queryExpr);

        return request.sendAndParse().then((list: Content[]) => {
            const suggestedTags: string[] = [];
            list.forEach((content: Content) => {
                const propertySet = this.propertyPath.getParentPath().isRoot() ?
                                    content.getContentData().getRoot() :
                                    content.getContentData().getPropertySet(this.propertyPath);
                propertySet.forEachProperty(this.propertyPath.getLastElement().getName(), (property: Property) => {
                    if (property.hasNonNullValue()) {
                        const suggestedTag = property.getString();
                        if (suggestedTag.search(new RegExp(searchString, 'i')) === 0 && suggestedTags.indexOf(suggestedTag) < 0) {
                            suggestedTags.push(suggestedTag);
                        }
                    }
                });
            });
            return suggestedTags;
        });
    }
}
