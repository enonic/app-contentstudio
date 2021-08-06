package com.enonic.xp.app.contentstudio.json.aggregation;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import com.enonic.xp.aggregation.Aggregation;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.WRAPPER_OBJECT)
@JsonSubTypes({@JsonSubTypes.Type(value = BucketAggregationJson.class, name = "BucketAggregation")})
public class AggregationJson
{
    private final String name;

    public AggregationJson( final Aggregation aggregation )
    {
        this.name = aggregation.getName();
    }

    public String getName()
    {
        return name;
    }

}
