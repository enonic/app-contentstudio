package com.enonic.xp.app.contentstudio.rest.resource.content.json.filter;

import java.time.Instant;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.content.ContentIndexPath;
import com.enonic.xp.data.ValueFactory;
import com.enonic.xp.query.filter.BooleanFilter;
import com.enonic.xp.query.filter.ExistsFilter;
import com.enonic.xp.query.filter.Filter;
import com.enonic.xp.query.filter.RangeFilter;

public class StatusesFilterJson
    extends FilterJson
{
    private final BooleanFilter statusesFilter;

    @JsonCreator
    public StatusesFilterJson( @JsonProperty("statuses") final Set<String> statuses )
    {
        final BooleanFilter.Builder builder = BooleanFilter.create();

        statuses.forEach( status -> {
            switch ( status )
            {
                case "NEW":
                {
                    builder.should( BooleanFilter.create().mustNot(
                        ExistsFilter.create().fieldName( ContentIndexPath.PUBLISH_FIRST.getPath() ).build() ).build() );
                    break;
                }
                case "UNPUBLISHED":
                {
                    builder.should( BooleanFilter.create().
                        must( ExistsFilter.create().fieldName( ContentIndexPath.PUBLISH_FIRST.getPath() ).build() ).
                        mustNot( ExistsFilter.create().fieldName( ContentIndexPath.PUBLISH_FROM.getPath() ).build() ).
                        build() );
                    break;
                }
                case "EXPIRED":
                {
                    builder.should( BooleanFilter.create().must( RangeFilter.create().fieldName(
                        ContentIndexPath.PUBLISH_TO.getPath() ).
                        to(ValueFactory.newDateTime( Instant.now() ) ).build() ).build() );
                    break;
                }
            }
        } );

        this.statusesFilter = builder.build();
    }

    @Override
    public Filter getFilter()
    {
        return statusesFilter;
    }
}
