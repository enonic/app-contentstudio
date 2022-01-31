package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.query.aggregation.AggregationQuery;
import com.enonic.xp.query.aggregation.StatusesAggregationQuery;

public class StatusesAggregationQueryJson
    extends AggregationQueryJson
{
    private final StatusesAggregationQuery statusesAggregationQuery;

    @JsonCreator
    public StatusesAggregationQueryJson( @JsonProperty("name") final String name )
    {
        this.statusesAggregationQuery = StatusesAggregationQuery.create( name ).build();
    }

    @Override
    public AggregationQuery getAggregationQuery()
    {
        return statusesAggregationQuery;
    }
}
