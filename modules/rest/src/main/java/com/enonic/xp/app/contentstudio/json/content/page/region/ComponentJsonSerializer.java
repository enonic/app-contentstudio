package com.enonic.xp.app.contentstudio.json.content.page.region;

import com.enonic.xp.app.contentstudio.rest.resource.content.ComponentDisplayNameResolver;
import com.enonic.xp.region.Component;
import com.enonic.xp.region.FragmentComponent;
import com.enonic.xp.region.ImageComponent;
import com.enonic.xp.region.LayoutComponent;
import com.enonic.xp.region.PartComponent;
import com.enonic.xp.region.TextComponent;

public final class ComponentJsonSerializer
{
    private final ComponentDisplayNameResolver componentDisplayNameResolver;

    public ComponentJsonSerializer( final ComponentDisplayNameResolver componentDisplayNameResolver )
    {
        this.componentDisplayNameResolver = componentDisplayNameResolver;
    }

    public ComponentJson toJson( final Component component )
    {
        if ( component instanceof LayoutComponent )
        {
            return toJson( (LayoutComponent) component );
        }

        if ( component instanceof TextComponent )
        {
            return toJson( (TextComponent) component );
        }

        if ( component instanceof PartComponent )
        {
            return toJson( (PartComponent) component );
        }

        if ( component instanceof ImageComponent )
        {
            return toJson( (ImageComponent) component );
        }

        if ( component instanceof FragmentComponent )
        {
            return toJson( (FragmentComponent) component );
        }

        throw new IllegalArgumentException( "Json for component " + component.getType().toString() + " not supported" );
    }

    private LayoutComponentJson toJson( final LayoutComponent component )
    {
        return new LayoutComponentJson( component, componentDisplayNameResolver );
    }

    private TextComponentJson toJson( final TextComponent component )
    {
        return new TextComponentJson( component, componentDisplayNameResolver );
    }

    private PartComponentJson toJson( final PartComponent component )
    {
        return new PartComponentJson( component, componentDisplayNameResolver );
    }

    private ImageComponentJson toJson( final ImageComponent component )
    {
        return new ImageComponentJson( component, componentDisplayNameResolver );
    }

    private FragmentComponentJson toJson( final FragmentComponent component )
    {
        return new FragmentComponentJson( component, componentDisplayNameResolver );
    }
}
