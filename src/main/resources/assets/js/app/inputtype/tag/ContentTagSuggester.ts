import ContentQuery = api.content.query.ContentQuery;
import QueryExpr = api.query.expr.QueryExpr;
import PropertyPath = api.data.PropertyPath;
import Property = api.data.Property;
import {TagSuggester} from '../ui/tag/TagSuggester';
import {ContentQueryRequest} from '../../resource/ContentQueryRequest';
import {ContentQueryResult} from '../../resource/ContentQueryResult';
import {Content} from '../../content/Content';
import {ContentJson} from '../../content/ContentJson';

export class ContentTagSuggesterBuilder {

    dataPath: PropertyPath;

    setDataPath(value: PropertyPath): ContentTagSuggesterBuilder {
        this.dataPath = value;
        return this;
    }

    build(): ContentTagSuggester {
        return new ContentTagSuggester(this);
    }
}

export class ContentTagSuggester
    implements TagSuggester {

    private propertyPath: PropertyPath;

    constructor(builder: ContentTagSuggesterBuilder) {
        this.propertyPath = builder.dataPath;
    }

    suggest(value: string): wemQ.Promise<string[]> {

        let fieldName = 'data' + this.propertyPath.getParentPath().toString() + this.propertyPath.getLastElement().getName();

        let fulltextExpression: api.query.expr.Expression = new api.query.FulltextSearchExpressionBuilder().setSearchString(value).addField(
            new api.query.QueryField(fieldName)).build();

        let queryExpr: QueryExpr = new QueryExpr(fulltextExpression);

        let query = new ContentQuery();
        query.setSize(10);
        query.setQueryExpr(queryExpr);

        let queryRequest = new ContentQueryRequest(query);
        queryRequest.setExpand(api.rest.Expand.FULL);

        return queryRequest.sendAndParse().then(
            (contentQueryResult: ContentQueryResult<Content, ContentJson>) => {

                let suggestedTags: string[] = [];
                contentQueryResult.getContents().forEach((content: Content) => {
                    let propertySet = this.propertyPath.getParentPath().isRoot() ?
                                      content.getContentData().getRoot() :
                                      content.getContentData().getPropertySet(this.propertyPath);
                    propertySet.forEachProperty(this.propertyPath.getLastElement().getName(), (property: Property) => {
                        if (property.hasNonNullValue()) {
                            let suggestedTag = property.getString();
                            if (suggestedTag.search(new RegExp(value, 'i')) === 0 && suggestedTags.indexOf(suggestedTag) < 0) {
                                suggestedTags.push(suggestedTag);
                            }
                        }
                    });
                });
                return suggestedTags;
            });
    }
}
