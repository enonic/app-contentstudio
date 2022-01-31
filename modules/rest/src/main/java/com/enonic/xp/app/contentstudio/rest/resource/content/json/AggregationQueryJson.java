package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import com.enonic.xp.query.aggregation.AggregationQuery;
import com.enonic.xp.query.aggregation.StatusesAggregationQuery;


@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.WRAPPER_OBJECT)
@JsonSubTypes({                                                                                                   //
    @JsonSubTypes.Type(value = TermsAggregationQueryJson.class, name = "TermsAggregationQuery"),    //
    @JsonSubTypes.Type(value = DateHistogramAggregationQueryJson.class, name = "DateHistogramAggregationQuery"),    //
    @JsonSubTypes.Type(value = DateRangeAggregationQueryJson.class, name = "DateRangeAggregationQuery"), //
    @JsonSubTypes.Type(value = HistogramAggregationQueryJson.class, name = "HistogramAggregationQuery"), //
    @JsonSubTypes.Type(value = MissingAggregationQueryJson.class, name = "MissingAggregationQuery"), //
    @JsonSubTypes.Type(value = StatusesAggregationQuery.class, name = "StatusesAggregationQuery") //
})
public abstract class AggregationQueryJson
{
    public abstract AggregationQuery getAggregationQuery();
}
