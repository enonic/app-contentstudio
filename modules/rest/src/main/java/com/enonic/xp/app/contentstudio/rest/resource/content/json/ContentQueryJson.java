package com.enonic.xp.app.contentstudio.rest.resource.content.json;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.app.contentstudio.rest.resource.content.json.filter.FilterJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
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

    private final String searchText;

    private final ContentId inboundReferenceId;

    private final ContentIds constraintItemsIds;

    @JsonCreator
    public ContentQueryJson(@JsonProperty("queryExpr") final String queryExprString, //
                            @JsonProperty("from") final Integer from, //
                            @JsonProperty("size") final Integer size, //
                            @JsonProperty("contentTypeNames") final List<String> contentTypeNameString,
                            @JsonProperty("mustBeReferencedById") final String mustBeReferencedById,
                            @JsonProperty("expand") final String expand,
                            @JsonProperty("aggregationQueries") final List<AggregationQueryJson> aggregationQueries, //
                            @JsonProperty("queryFilters") final List<FilterJson> queryFilters,
                            @JsonProperty("searchText") final String searchText,
                            @JsonProperty("inboundReferenceId") final String inboundReferenceId,
                            @JsonProperty("constraintItemsIds") final List<String> constraintItemsIds
                            )
    {

        this.queryExprString = queryExprString;
        this.from = from;
        this.size = size;
        this.contentTypeNames = ContentTypeNames.from( contentTypeNameString );
        this.mustBeReferencedById = mustBeReferencedById != null ? ContentId.from( mustBeReferencedById ) : null;
        this.aggregationQueries = aggregationQueries;
        this.queryFilters = queryFilters;
        this.searchText = searchText;
        this.inboundReferenceId = inboundReferenceId != null ? ContentId.from( inboundReferenceId ) : null;
        this.constraintItemsIds = constraintItemsIds != null ? ContentIds.from( constraintItemsIds ): null;
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

    @JsonIgnore
    public String getSearchText()
    {
        return searchText;
    }

    @JsonIgnore
    public ContentId getInboundReferenceId()
    {
        return inboundReferenceId;
    }

    @JsonIgnore
    public ContentIds getConstraintItemsIds()
    {
        return constraintItemsIds;
    }
}
