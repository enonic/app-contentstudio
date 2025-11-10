package com.enonic.app.contentstudio.json.content.page.region;


import java.util.List;
import java.util.Objects;

import com.enonic.app.contentstudio.rest.resource.content.ComponentDisplayNameResolver;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.data.PropertyTreeJson;
import com.enonic.xp.region.DescriptorBasedComponent;

@SuppressWarnings("UnusedDeclaration")
public abstract class DescriptorBasedComponentJson<COMPONENT extends DescriptorBasedComponent>
    extends ComponentJson<COMPONENT>
{
    private final List<PropertyArrayJson> config;

    protected DescriptorBasedComponentJson( final COMPONENT component, final ComponentDisplayNameResolver componentDisplayNameResolver )
    {
        super( component, componentDisplayNameResolver );
        this.config = component.getConfig() != null ? PropertyTreeJson.toJson( component.getConfig() ) : null;
    }

    public String getDescriptor()
    {
        return Objects.toString( getComponent().getDescriptor(), null );
    }

    public List<PropertyArrayJson> getConfig()
    {
        return config;
    }
}
