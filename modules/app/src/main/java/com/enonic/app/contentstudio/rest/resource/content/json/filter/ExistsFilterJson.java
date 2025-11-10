package com.enonic.app.contentstudio.rest.resource.content.json.filter;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.query.filter.ExistsFilter;
import com.enonic.xp.query.filter.Filter;

public class ExistsFilterJson
    extends FilterJson
{
    private final ExistsFilter existsFilter;

    @JsonCreator
    public ExistsFilterJson( @JsonProperty("fieldName") final String fieldName )
    {
        final ExistsFilter.Builder builder = ExistsFilter.create().fieldName( fieldName );

        this.existsFilter = builder.build();
    }

    @Override
    public Filter getFilter()
    {
        return existsFilter;
    }
}
