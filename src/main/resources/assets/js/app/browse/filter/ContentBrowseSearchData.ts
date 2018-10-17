import {ContentQueryResult} from '../../resource/ContentQueryResult';

export class ContentBrowseSearchData {

    private contentQueryResult: ContentQueryResult<any, any>;
    private contentQuery: api.content.query.ContentQuery;

    constructor(contentQueryResult: ContentQueryResult<any, any>,
                contentQuery?: api.content.query.ContentQuery) {

        this.contentQueryResult = contentQueryResult;
        this.contentQuery = contentQuery;
    }

    getContentQueryResult(): ContentQueryResult<any, any> {
        return this.contentQueryResult;
    }

    getContentQuery(): api.content.query.ContentQuery {
        return this.contentQuery;
    }
}
