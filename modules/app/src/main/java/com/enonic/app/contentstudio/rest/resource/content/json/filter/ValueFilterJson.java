package com.enonic.app.contentstudio.rest.resource.content.json.filter;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.query.filter.Filter;
import com.enonic.xp.query.filter.ValueFilter;

import static com.google.common.base.Strings.isNullOrEmpty;

public class ValueFilterJson extends FilterJson
{
    private final ValueFilter valueFilter;

    @JsonCreator
    public ValueFilterJson( @JsonProperty("fieldName") final String fieldName, //
                            @JsonProperty("value") final String value )
    {
        final ValueFilter.Builder builder = ValueFilter.create().
            fieldName( fieldName );

        if ( !isNullOrEmpty( value ) )
        {
            builder.addValues( value );
        }

        this.valueFilter = builder.build();
    }

    @Override
    public Filter getFilter()
    {
        return valueFilter;
    }
}
