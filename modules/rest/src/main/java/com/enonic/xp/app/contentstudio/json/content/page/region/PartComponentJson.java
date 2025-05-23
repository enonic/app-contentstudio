package com.enonic.xp.app.contentstudio.json.content.page.region;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.app.contentstudio.rest.resource.content.ComponentDisplayNameResolver;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.data.PropertyTreeJson;
import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.region.PartComponent;

@SuppressWarnings("UnusedDeclaration")
public class PartComponentJson
    extends DescriptorBasedComponentJson<PartComponent>
{
    private final PartComponent part;

    public PartComponentJson( final PartComponent component, final ComponentDisplayNameResolver componentDisplayNameResolver )
    {
        super( component, componentDisplayNameResolver );
        this.part = component;
    }

    @JsonCreator
    public PartComponentJson( @JsonProperty("descriptor") final String descriptor,
                              @JsonProperty("config") final List<PropertyArrayJson> config,
                              @Deprecated @JsonProperty("name") final String name )
    {
        super( PartComponent.create().
            descriptor( descriptor != null ? DescriptorKey.from( descriptor ) : null ).
            config( config != null ? PropertyTreeJson.fromJson( config ) : null ).
            build(), null );

        this.part = getComponent();
    }
}
