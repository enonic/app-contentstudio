package com.enonic.xp.app.contentstudio.rest.resource.content;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.aggregation.Aggregation;
import com.enonic.xp.aggregation.Aggregations;
import com.enonic.xp.aggregation.BucketAggregation;
import com.enonic.xp.app.contentstudio.json.aggregation.BucketAggregationJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.AbstractContentQueryResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentIdQueryResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentQueryResultJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ContentSummaryQueryResultJson;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.Contents;

public class FindContentByQuertResultJsonFactory
{
    private final long totalHits;

    private final long hits;

    private final Contents contents;

    private final Aggregations aggregations;

    private final JsonObjectsFactory jsonObjectsFactory;

    private final HttpServletRequest request;

    private final String expand;

    private FindContentByQuertResultJsonFactory( final Builder builder )
    {
        totalHits = builder.totalHits;
        hits = builder.hits;
        contents = builder.contents;
        aggregations = builder.aggregations;
        jsonObjectsFactory = builder.jsonObjectsFactory;
        expand = builder.expand;
        request = builder.request;
    }

    private static void addContents( final Contents contents, final AbstractContentQueryResultJson.Builder builder )
    {
        for ( final Content content : contents )
        {
            builder.addContent( content );
        }
    }

    private static void addAggregations( final Aggregations aggregations, final AbstractContentQueryResultJson.Builder builder )
    {
        if ( aggregations == null )
        {
            return;
        }

        for ( final Aggregation aggregation : aggregations )
        {
            if ( aggregation instanceof BucketAggregation )
            {
                builder.addAggregation( new BucketAggregationJson( (BucketAggregation) aggregation ) );
            }
        }
    }

    private static void setMetadata( final ContentListMetaData metadata, final AbstractContentQueryResultJson.Builder builder )
    {
        builder.setMetadata( metadata );
    }

    public static Builder create()
    {
        return new Builder();
    }

    public AbstractContentQueryResultJson execute()
    {
        final AbstractContentQueryResultJson.Builder builder;

        final ContentListMetaData metadata = ContentListMetaData.create().
            totalHits( this.totalHits ).
            hits( this.hits ).
            build();

        if ( Expand.FULL.matches( expand ) )
        {
            builder = ContentQueryResultJson.newBuilder( jsonObjectsFactory, request );
        }
        else if ( Expand.SUMMARY.matches( expand ) )
        {
            builder = ContentSummaryQueryResultJson.newBuilder( jsonObjectsFactory, request );
        }
        else
        {
            builder = ContentIdQueryResultJson.newBuilder();
        }

        addAggregations( this.aggregations, builder );
        addContents( this.contents, builder );
        setMetadata( metadata, builder );

        return builder.build();
    }

    public static final class Builder
    {
        private long totalHits = 0;

        private long hits = 0;

        private Contents contents = Contents.empty();

        private Aggregations aggregations = Aggregations.empty();

        private JsonObjectsFactory jsonObjectsFactory;

        private String expand;

        private HttpServletRequest request;

        private Builder()
        {
        }

        public Builder totalHits( final long val )
        {
            totalHits = val;
            return this;
        }

        public Builder hits( final long val )
        {
            hits = val;
            return this;
        }

        public Builder contents( final Contents val )
        {
            contents = val;
            return this;
        }

        public Builder aggregations( final Aggregations val )
        {
            aggregations = val;
            return this;
        }

        public Builder jsonObjectsFactory( final JsonObjectsFactory val )
        {
            jsonObjectsFactory = val;
            return this;
        }

        public Builder expand( final String val )
        {
            expand = val;
            return this;
        }

        public Builder request( final HttpServletRequest val )
        {
            request = val;
            return this;
        }

        public FindContentByQuertResultJsonFactory build()
        {
            return new FindContentByQuertResultJsonFactory( this );
        }
    }
}
