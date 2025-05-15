package com.enonic.xp.app.contentstudio.rest.resource.content;

import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.region.Component;
import com.enonic.xp.region.ComponentDescriptor;
import com.enonic.xp.region.FragmentComponent;
import com.enonic.xp.region.ImageComponent;
import com.enonic.xp.region.LayoutComponent;
import com.enonic.xp.region.LayoutDescriptorService;
import com.enonic.xp.region.PartComponent;
import com.enonic.xp.region.PartDescriptorService;
import com.enonic.xp.region.TextComponent;

@org.osgi.service.component.annotations.Component
public final class ComponentDisplayNameResolverImpl
    implements ComponentDisplayNameResolver
{
    private PartDescriptorService partDescriptorService;

    private LayoutDescriptorService layoutDescriptorService;

    private ContentService contentService;

    public String resolve( final Component component )
    {
        if ( component instanceof PartComponent )
        {
            return resolve( (PartComponent) component );
        }
        else if ( component instanceof LayoutComponent )
        {
            return resolve( (LayoutComponent) component );
        }
        else if ( component instanceof FragmentComponent )
        {
            return resolve( (FragmentComponent) component );
        }
        else if ( component instanceof ImageComponent )
        {
            return resolve( (ImageComponent) component );
        }
        else if ( component instanceof TextComponent )
        {
            return "Text";
        }
        return null;
    }

    public String resolve( final PartComponent component )
    {
        return doGenerateDisplayName(
            component.hasDescriptor() ? this.partDescriptorService.getByKey( component.getDescriptor() ) : null, "Part" );
    }

    public String resolve( final LayoutComponent component )
    {
        return doGenerateDisplayName(
            component.hasDescriptor() ? this.layoutDescriptorService.getByKey( component.getDescriptor() ) : null, "Layout" );
    }

    public String resolve( final ImageComponent component )
    {
        return resolveContentDisplayName( component.getImage(), "Image" );
    }

    public String resolve( final FragmentComponent component )
    {
        return resolveContentDisplayName( component.getFragment(), "Fragment" );
    }

    private String resolveContentDisplayName( final ContentId contentId, final String defaultName )
    {
        if ( contentId != null )
        {
            try
            {
                final Content content = contentService.getById( contentId );
                return content.getDisplayName();
            }
            catch ( final ContentNotFoundException e )
            {
            }
        }

        return defaultName;
    }

    private String doGenerateDisplayName( final ComponentDescriptor componentDescriptor, final String defaultName )
    {
        if ( componentDescriptor != null && componentDescriptor.getDisplayName() != null )
        {
            return componentDescriptor.getDisplayName();
        }

        return defaultName;
    }

    @Reference
    public void setPartDescriptorService( final PartDescriptorService partDescriptorService )
    {
        this.partDescriptorService = partDescriptorService;
    }

    @Reference
    public void setLayoutDescriptorService( final LayoutDescriptorService layoutDescriptorService )
    {
        this.layoutDescriptorService = layoutDescriptorService;
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }
}
