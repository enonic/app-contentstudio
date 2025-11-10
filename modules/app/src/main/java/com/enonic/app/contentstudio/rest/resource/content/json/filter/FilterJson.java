package com.enonic.app.contentstudio.rest.resource.content.json.filter;


import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import com.enonic.xp.query.filter.Filter;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.WRAPPER_OBJECT)
@JsonSubTypes({                                                                                                   //
    @JsonSubTypes.Type(value = BooleanFilterJson.class, name = "BooleanFilter"),    //
    @JsonSubTypes.Type(value = RangeFilterJson.class, name = "RangeFilter"), //
    @JsonSubTypes.Type(value = ExistsFilterJson.class, name = "ExistsFilter"), //
    @JsonSubTypes.Type(value = ValueFilterJson.class, name = "ValueFilter") //
})

public abstract class FilterJson
{
    public abstract Filter getFilter();
}
