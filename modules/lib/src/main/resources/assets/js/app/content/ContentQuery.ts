import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {type QueryExpr} from '@enonic/lib-admin-ui/query/expr/QueryExpr';
import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type AggregationQuery} from '@enonic/lib-admin-ui/query/aggregation/AggregationQuery';
import {type Filter} from '@enonic/lib-admin-ui/query/filter/Filter';
import {type ContentId} from './ContentId';

export class ContentQuery
    implements Equitable {

    static POSTLOAD_SIZE: number = 10;

    static DEFAULT_SIZE: number = 100;

    private queryExpr: QueryExpr;

    private contentTypeNames: ContentTypeName[] = [];

    private mustBeReferencedById: ContentId;

    private query: object;

    private querySort: object[];

    private aggregationQueries: AggregationQuery[] = [];

    private queryFilters: Filter[] = [];

    private from: number = 0;

    private size: number = ContentQuery.DEFAULT_SIZE;

    setQueryExpr(queryExpr: QueryExpr): ContentQuery {
        this.queryExpr = queryExpr;
        return this;
    }

    getQueryExpr(): QueryExpr {
        return this.queryExpr;
    }

    setContentTypeNames(contentTypeNames: ContentTypeName[]): ContentQuery {
        this.contentTypeNames = contentTypeNames;
        return this;
    }

    getContentTypes(): ContentTypeName[] {
        return this.contentTypeNames;
    }

    setMustBeReferencedById(id: ContentId): ContentQuery {
        this.mustBeReferencedById = id;
        return this;
    }

    getMustBeReferencedById(): ContentId {
        return this.mustBeReferencedById;
    }

    setQuery(value: object): ContentQuery {
        this.query = value;
        return this;
    }

    getQuery(): object {
        return this.query;
    }

    setQuerySort(value: object[]): ContentQuery {
        this.querySort = value;
        return this;
    }

    getQuerySort(): object[] {
        return this.querySort;
    }

    setFrom(from: number): ContentQuery {
        this.from = from;
        return this;
    }

    getFrom(): number {
        return this.from;
    }

    setSize(size: number): ContentQuery {
        this.size = size;
        return this;
    }

    getSize(): number {
        return this.size;
    }

    addAggregationQuery(aggregationQuery: AggregationQuery): ContentQuery {
        this.aggregationQueries.push(aggregationQuery);
        return this;
    }

    setAggregationQueries(aggregationQueries: AggregationQuery[]): ContentQuery {
        this.aggregationQueries = aggregationQueries;
        return this;
    }

    getAggregationQueries(): AggregationQuery[] {
        return this.aggregationQueries;
    }

    addQueryFilter(queryFilter: Filter): ContentQuery {
        this.queryFilters.push(queryFilter);
        return this;
    }

    setQueryFilters(queryFilters: Filter[]): ContentQuery {
        this.queryFilters = queryFilters;
        return this;
    }

    getQueryFilters(): Filter[] {
        return this.queryFilters;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ContentQuery)) {
            return false;
        }

        const other = o as ContentQuery;

        if (!ObjectHelper.numberEquals(this.from, other.from)) {
            return false;
        }

        if (!ObjectHelper.numberEquals(this.size, other.size)) {
            return false;
        }

        if (!ObjectHelper.stringEquals(JSON.stringify(this.query), JSON.stringify(other.query))) {
            return false;
        }

        if (!ObjectHelper.stringEquals(JSON.stringify(this.querySort), JSON.stringify(other.querySort))) {
            return false;
        }

        if (!ObjectHelper.arrayEquals(this.contentTypeNames, other.contentTypeNames)) {
            return false;
        }

        if (!ObjectHelper.anyArrayEquals(this.aggregationQueries, other.aggregationQueries)) {
            return false;
        }

        if (!ObjectHelper.anyArrayEquals(this.queryFilters, other.queryFilters)) {
            return false;
        }

        if (!ObjectHelper.equals(this.mustBeReferencedById, other.mustBeReferencedById)) {
            return false;
        }

        if ((!this.queryExpr && other.queryExpr) ||
            (this.queryExpr && !other.queryExpr) ||
            (this.queryExpr && other.queryExpr &&
             !ObjectHelper.stringEquals(this.queryExpr.toString(), other.queryExpr.toString()))) {
            return false;
        }

        return true;
    }
}
