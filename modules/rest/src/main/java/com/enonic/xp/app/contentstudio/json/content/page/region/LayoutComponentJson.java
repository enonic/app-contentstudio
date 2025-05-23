package com.enonic.xp.app.contentstudio.json.content.page.region;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.app.contentstudio.rest.resource.content.ComponentDisplayNameResolver;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.data.PropertyTreeJson;
import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.region.LayoutComponent;

@SuppressWarnings("UnusedDeclaration")
public class LayoutComponentJson
    extends DescriptorBasedComponentJson<LayoutComponent>
{
    private final LayoutComponent layout;

    private final LayoutRegionsJson regionsJson;

    @JsonCreator
    public LayoutComponentJson( @JsonProperty("descriptor") final String descriptor,
                                @JsonProperty("config") final List<PropertyArrayJson> config,
                                final @JsonProperty("regions") List<RegionJson> regions,
                                @Deprecated @JsonProperty("name") final String name )
    {
        super( LayoutComponent.create().
            descriptor( descriptor != null ? DescriptorKey.from( descriptor ) : null ).
            config( config != null ? PropertyTreeJson.fromJson( config ) : null ).
            regions( regions != null ? new LayoutRegionsJson( regions ).getLayoutRegions() : null ).
            build(), null );

        this.layout = getComponent();
        this.regionsJson = new LayoutRegionsJson( layout.getRegions(), null );
    }

    public LayoutComponentJson( final LayoutComponent component, final ComponentDisplayNameResolver componentDisplayNameResolver )
    {
        super( component, componentDisplayNameResolver );
        this.layout = component;
        this.regionsJson = new LayoutRegionsJson( component.getRegions(), componentDisplayNameResolver );
    }

    public List<RegionJson> getRegions()
    {
        return regionsJson.getRegions();
    }
}
