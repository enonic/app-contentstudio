package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.app.contentstudio.rest.resource.content.json.filter.FilterJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.schema.content.ContentTypeNames;

public class ContentQueryJson
{
    private final String expand;

    private final String queryExprString;

    private final Integer from;

    private final Integer size;

    private final ContentId mustBeReferencedById;

    private final ContentTypeNames contentTypeNames;

    private final List<AggregationQueryJson> aggregationQueries;

    private final List<FilterJson> queryFilters;

//    private final List<String> statuses;

    @JsonCreator
    public ContentQueryJson( @JsonProperty("queryExpr") final String queryExprString, //
                             @JsonProperty("from") final Integer from, //
                             @JsonProperty("size") final Integer size, //
                             @JsonProperty("contentTypeNames") final List<String> contentTypeNameString,
                             @JsonProperty("mustBeReferencedById") final String mustBeReferencedById,
                             @JsonProperty("expand") final String expand,
                             @JsonProperty("aggregationQueries") final List<AggregationQueryJson> aggregationQueries, //
                             @JsonProperty("queryFilters") final List<FilterJson> queryFilters/*,
                             @JsonProperty("statuses") final List<String> statuses*/ )
    {

        this.queryExprString = queryExprString;
        this.from = from;
        this.size = size;
        this.contentTypeNames = ContentTypeNames.from( contentTypeNameString );
        this.mustBeReferencedById = mustBeReferencedById != null ? ContentId.from( mustBeReferencedById ) : null;
        this.aggregationQueries = aggregationQueries;
        this.queryFilters = queryFilters;
//        this.statuses = statuses;

        this.expand = expand != null ? expand : "none";
    }

    @JsonIgnore
    public String getQueryExprString()
    {
        return queryExprString;
    }

    @JsonIgnore
    public Integer getFrom()
    {
        return from;
    }

    @JsonIgnore
    public Integer getSize()
    {
        return size;
    }

    @JsonIgnore
    public ContentId getMustBeReferencedById()
    {
        return mustBeReferencedById;
    }

    @JsonIgnore
    public ContentTypeNames getContentTypeNames()
    {
        return contentTypeNames;
    }

    @JsonIgnore
    public List<AggregationQueryJson> getAggregationQueries()
    {
        return aggregationQueries;
    }

    @JsonIgnore
    public List<FilterJson> getQueryFilters()
    {
        return queryFilters;
    }

    @JsonIgnore
    public String getExpand()
    {
        return expand;
    }

//    @JsonIgnore
//    public List<String> getStatuses()
//    {
//        return statuses;
//    }
}
