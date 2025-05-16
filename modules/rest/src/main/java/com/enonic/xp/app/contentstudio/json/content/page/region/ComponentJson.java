package com.enonic.xp.app.contentstudio.json.content.page.region;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import com.enonic.xp.app.contentstudio.rest.resource.content.ComponentDisplayNameResolver;
import com.enonic.xp.region.Component;

@SuppressWarnings("UnusedDeclaration")
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.WRAPPER_OBJECT)
@JsonSubTypes({@JsonSubTypes.Type(value = ImageComponentJson.class, name = "ImageComponent"),
    @JsonSubTypes.Type(value = PartComponentJson.class, name = "PartComponent"),
    @JsonSubTypes.Type(value = LayoutComponentJson.class, name = "LayoutComponent"),
    @JsonSubTypes.Type(value = TextComponentJson.class, name = "TextComponent"),
    @JsonSubTypes.Type(value = FragmentComponentJson.class, name = "FragmentComponent")})
public abstract class ComponentJson<COMPONENT extends Component>
{
    private final COMPONENT component;

    protected final ComponentDisplayNameResolver componentDisplayNameResolver;

    protected ComponentJson( final COMPONENT component, final ComponentDisplayNameResolver componentDisplayNameResolver )
    {
        this.component = component;
        this.componentDisplayNameResolver = componentDisplayNameResolver;
    }

    public String getName()
    {
        return componentDisplayNameResolver != null ? componentDisplayNameResolver.resolve( component ) : null;
    }

    @JsonIgnore
    public COMPONENT getComponent()
    {
        return this.component;
    }
}
