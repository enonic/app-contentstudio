package com.enonic.xp.app.contentstudio.json.content;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.content.Mixin;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.data.PropertyTreeJson;
import com.enonic.xp.schema.mixin.MixinName;

public class MixinJson
{
    private final String name;

    private final List<PropertyArrayJson> data;

    public MixinJson( final Mixin mixin )
    {
        this.name = mixin.getName().toString();
        this.data = PropertyTreeJson.toJson( mixin.getData() );
    }

    @JsonCreator
    public MixinJson( @JsonProperty("name") final String name, @JsonProperty("data") final List<PropertyArrayJson> dataJsonList )
    {
        this.name = name;
        this.data = dataJsonList;
    }

    public String getName()
    {
        return name;
    }

    public List<PropertyArrayJson> getData()
    {
        return data;
    }

    @JsonIgnore
    public Mixin getMixin()
    {
        return new Mixin( MixinName.from( name ), PropertyTreeJson.fromJson( data ) );
    }
}
