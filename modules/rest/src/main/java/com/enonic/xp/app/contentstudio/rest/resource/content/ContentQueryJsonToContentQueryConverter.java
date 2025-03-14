package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.google.common.collect.ImmutableList;

import com.enonic.xp.app.contentstudio.rest.resource.content.json.AggregationQueryJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentQueryJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.filter.FilterJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentQuery;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.query.expr.DslExpr;
import com.enonic.xp.query.expr.DslOrderExpr;
import com.enonic.xp.query.expr.OrderExpr;
import com.enonic.xp.query.expr.QueryExpr;
import com.enonic.xp.query.parser.QueryParser;

public class ContentQueryJsonToContentQueryConverter
{
    private final ContentQueryJson contentQueryJson;

    private final ContentService contentService;

    private ContentQueryJsonToContentQueryConverter( final Builder builder )
    {
        this.contentQueryJson = builder.contentQueryJson;
        this.contentService = builder.contentService;
    }

    public static Builder create()
    {
        return new Builder();
    }

    public ContentQuery createQuery()
    {
        try
        {
            return doCreateQuery();
        }
        catch ( ContentQueryJsonConvertException ex )
        {
            return null;
        }
    }

    private ContentQuery doCreateQuery()
        throws ContentQueryJsonConvertException
    {
        final ContentQuery.Builder builder = ContentQuery.create()
            .from( contentQueryJson.getFrom() )
            .size( contentQueryJson.getSize() )
            .addContentTypeNames( contentQueryJson.getContentTypeNames() );

        addOutboundContentIdsToFilter( builder );

        addAggregationQueries( builder );

        addQueryFilters( builder );

        addQueryExpr( builder );

        return builder.build();
    }

    private void addOutboundContentIdsToFilter( final ContentQuery.Builder builder )
    {
        if ( contentQueryJson.getMustBeReferencedById() != null )
        {
            final ContentIds ids = this.contentService.getOutboundDependencies( contentQueryJson.getMustBeReferencedById() );

            final ContentIds existingContentIds = getExistingContentIds( ContentIds.from( ids ) );

            //TODO Delete ContentQueryJsonConvertException after fixing ContentQueryNodeQueryTranslator in 7.0
            if ( existingContentIds.isEmpty() )
            {
                throw new ContentQueryJsonConvertException(
                    "'mustBeReferencedById' content exists, but doesn't have any outbound references" );
            }

            //TODO: no need to filter when we fix that removed content will be removed from references
            builder.filterContentIds( existingContentIds );
        }

    }

    private ContentIds getExistingContentIds( final ContentIds contentIds )
    {
        final Contents contents = this.contentService.getByIds( new GetContentByIdsParams( contentIds ) );
        final List<ContentId> existingContentIds = new ArrayList<>();
        contents.forEach( content -> existingContentIds.add( content.getId() ) );
        return ContentIds.from( existingContentIds );
    }

    private void addAggregationQueries( final ContentQuery.Builder builder )
    {
        if ( contentQueryJson.getAggregationQueries() != null )
        {
            for ( final AggregationQueryJson aggregationQueryJson : contentQueryJson.getAggregationQueries() )
            {
                builder.aggregationQuery( aggregationQueryJson.getAggregationQuery() );
            }
        }
    }

    private void addQueryFilters( final ContentQuery.Builder builder )
    {
        if ( contentQueryJson.getQueryFilters() != null )
        {
            for ( final FilterJson queryFilterJson : contentQueryJson.getQueryFilters() )
            {
                builder.queryFilter( queryFilterJson.getFilter() );
            }
        }
    }

    private void addQueryExpr( final ContentQuery.Builder builder )
    {
        if ( contentQueryJson.getQuery() != null )
        {
            builder.queryExpr( QueryExpr.from( createDslExpr() , createDslSortExpr() ) );
        }
        else
        {
            builder.queryExpr( QueryParser.parse( contentQueryJson.getQueryExprString() ) );
        }
    }

    private DslExpr createDslExpr()
    {
        return DslExpr.from( PropertyTree.fromMap( contentQueryJson.getQuery() ) );
    }

    private List<OrderExpr> createDslSortExpr()
    {
        if ( contentQueryJson.getQuerySort() == null )
        {
            return ImmutableList.of();
        }

        return contentQueryJson.getQuerySort().stream()
            .map( expr -> DslOrderExpr.from( PropertyTree.fromMap( expr ) ) )
            .collect( Collectors.toList() );
    }

    static class Builder
    {
        private ContentQueryJson contentQueryJson;

        private ContentService contentService;

        public Builder contentQueryJson( final ContentQueryJson contentQueryJson )
        {
            this.contentQueryJson = contentQueryJson;
            return this;
        }

        public Builder contentService( final ContentService contentService )
        {
            this.contentService = contentService;
            return this;
        }

        public ContentQueryJsonToContentQueryConverter build()
        {
            return new ContentQueryJsonToContentQueryConverter( this );
        }
    }
}
