package com.enonic.app.contentstudio.json.content.page.region;


import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.app.contentstudio.rest.resource.content.ComponentDisplayNameResolver;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.data.PropertyArrayJson;
import com.enonic.xp.region.FragmentComponent;

@SuppressWarnings("UnusedDeclaration")
public class FragmentComponentJson
    extends ComponentJson<FragmentComponent>
{
    private final FragmentComponent fragment;

    @JsonCreator
    public FragmentComponentJson( @JsonProperty("config") final List<PropertyArrayJson> config,
                                  @JsonProperty("fragment") final String fragment, @Deprecated @JsonProperty("name") final String name )
    {
        super( FragmentComponent.create().
            fragment( fragment != null ? ContentId.from( fragment ) : null ).
            build(), null );

        this.fragment = getComponent();
    }

    public FragmentComponentJson( final FragmentComponent component, final ComponentDisplayNameResolver componentDisplayNameResolver )
    {
        super( component, componentDisplayNameResolver );
        this.fragment = component;
    }

    public String getFragment()
    {
        return fragment.getFragment() != null ? fragment.getFragment().toString() : null;
    }
}
