import QueryExpr = api.query.expr.QueryExpr;
import PropertyPath = api.data.PropertyPath;
import Property = api.data.Property;
import ContentSummary = api.content.ContentSummary;
import {TagSuggester} from '../ui/tag/TagSuggester';
import {Content} from '../../content/Content';
import {ContentJson} from '../../content/ContentJson';
import {ContentSelectorQueryRequest} from '../../resource/ContentSelectorQueryRequest';
import {GetNearestSiteRequest} from '../../resource/GetNearestSiteRequest';
import {Site} from '../../content/Site';
import {Tag} from './Tag';

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

    private propertyPath: PropertyPath;

    private content: ContentSummary;

    private allowedPaths: string[] = [];

    constructor(builder: ContentTagSuggesterBuilder) {
        this.propertyPath = builder.dataPath;
        this.content = builder.content;
        this.allowedPaths = builder.allowedPaths;
    }

    suggest(searchString: string): wemQ.Promise<string[]> {

        const fieldName = 'data' + this.propertyPath.getParentPath().toString() + this.propertyPath.getLastElement().getName();

        const fulltextExpression: api.query.expr.Expression = new api.query.FulltextSearchExpressionBuilder()
            .setSearchString(searchString)
            .addField(new api.query.QueryField(fieldName))
            .build();

        const queryExpr: QueryExpr = new QueryExpr(fulltextExpression);

        return this.checkAndFindTags(searchString, queryExpr);
    }

    private checkAndFindTags(searchString: string, queryExpr: QueryExpr): wemQ.Promise<string[]> {
        const restrictedToSite = api.ObjectHelper.anyArrayEquals([Tag.DEFAULT_ALLOWED_PATH], this.allowedPaths);

        return (restrictedToSite ? this.hasNearestSite() : wemQ(true)).then((canFind: boolean) => {
            return canFind ? this.findTags(searchString, queryExpr) : wemQ([]);
        });
    }

    private hasNearestSite(): wemQ.Promise<boolean> {
        return new GetNearestSiteRequest(this.content.getContentId()).sendAndParse().then((site: Site) => !!site);
    }

    private findTags(searchString: string, queryExpr: QueryExpr): wemQ.Promise<string[]> {
        const request = new ContentSelectorQueryRequest<ContentJson, Content>();

        request.setSize(10);
        request.setContent(this.content);
        request.setExpand(api.rest.Expand.FULL);
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
