package com.enonic.app.contentstudio.json.content.page.region;


import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.app.contentstudio.rest.resource.content.ComponentDisplayNameResolver;
import com.enonic.xp.region.Component;
import com.enonic.xp.region.Region;

@SuppressWarnings("UnusedDeclaration")
public class RegionJson
{
    private final Region region;

    private final List<ComponentJson> components = new ArrayList<>();

    @JsonCreator
    public RegionJson( @JsonProperty("name") final String name, @JsonProperty("components") final List<ComponentJson> componentJsons )
    {
        final Region.Builder builder = Region.create();
        builder.name( name );
        for ( final ComponentJson componentJson : componentJsons )
        {
            builder.add( componentJson.getComponent() );
        }
        this.region = builder.build();
    }

    public RegionJson( final Region region, final ComponentDisplayNameResolver componentDisplayNameResolver )
    {
        this.region = region;

        final ComponentJsonSerializer componentJsonSerializer = new ComponentJsonSerializer( componentDisplayNameResolver );
        for ( final Component component : region.getComponents() )
        {
            this.components.add( componentJsonSerializer.toJson( component ) );
        }
    }

    public String getName()
    {
        return region.getName();
    }

    public List<ComponentJson> getComponents()
    {
        return this.components;
    }

    @JsonIgnore
    public Region getRegion()
    {
        return this.region;
    }
}
