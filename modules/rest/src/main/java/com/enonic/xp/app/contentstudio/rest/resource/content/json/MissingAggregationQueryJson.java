package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.query.aggregation.AggregationQuery;
import com.enonic.xp.query.aggregation.MissingAggregationQuery;

public class MissingAggregationQueryJson
    extends AggregationQueryJson
{

    private final MissingAggregationQuery missingAggregationQuery;

    @JsonCreator
    public MissingAggregationQueryJson( @JsonProperty("name") final String name, //
                                        @JsonProperty("fieldName") final String fieldName )
    {
        final MissingAggregationQuery.Builder builder = MissingAggregationQuery.create( name ).fieldName( fieldName );

        this.missingAggregationQuery = builder.build();
    }

    @Override
    public AggregationQuery getAggregationQuery()
    {
        return missingAggregationQuery;
    }

}
