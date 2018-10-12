import {ContentQueryResult} from '../../resource/ContentQueryResult';
import {ContentQuery} from '../../content/ContentQuery';

export class ContentBrowseSearchData {

    private contentQueryResult: ContentQueryResult<any, any>;
    private contentQuery: ContentQuery;

    constructor(contentQueryResult: ContentQueryResult<any, any>,
                contentQuery?: ContentQuery) {

        this.contentQueryResult = contentQueryResult;
        this.contentQuery = contentQuery;
    }

    getContentQueryResult(): ContentQueryResult<any, any> {
        return this.contentQueryResult;
    }

    getContentQuery(): ContentQuery {
        return this.contentQuery;
    }
}
