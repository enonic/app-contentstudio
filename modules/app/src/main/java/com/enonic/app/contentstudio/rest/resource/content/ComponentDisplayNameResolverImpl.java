package com.enonic.app.contentstudio.rest.resource.content;

import java.util.List;
import java.util.Locale;

import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
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

    private LocaleService localeService;

    @Override
    public String resolve( final Component component, final List<Locale> locales )
    {
        if ( component instanceof PartComponent )
        {
            return resolve( (PartComponent) component, locales );
        }
        else if ( component instanceof LayoutComponent )
        {
            return resolve( (LayoutComponent) component, locales );
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
        return resolve( component, List.of() );
    }

    public String resolve( final LayoutComponent component )
    {
        return resolve( component, List.of() );
    }

    private String resolve( final PartComponent component, final List<Locale> locales )
    {
        return doGenerateDisplayName(
            component.hasDescriptor() ? this.partDescriptorService.getByKey( component.getDescriptor() ) : null, "Part", locales );
    }

    private String resolve( final LayoutComponent component, final List<Locale> locales )
    {
        return doGenerateDisplayName(
            component.hasDescriptor() ? this.layoutDescriptorService.getByKey( component.getDescriptor() ) : null, "Layout", locales );
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

    private String doGenerateDisplayName( final ComponentDescriptor componentDescriptor, final String defaultName,
                                          final List<Locale> locales )
    {
        if ( componentDescriptor != null && componentDescriptor.getTitle() != null )
        {
            return localize( componentDescriptor, locales );
        }

        return defaultName;
    }

    private String localize( final ComponentDescriptor componentDescriptor, final List<Locale> locales )
    {
        final String title = componentDescriptor.getTitle();
        final String i18nKey = componentDescriptor.getTitleI18nKey();

        if ( i18nKey == null || i18nKey.isBlank() || locales.isEmpty() )
        {
            return title;
        }

        final Locale locale = this.localeService.getSupportedLocale( locales, componentDescriptor.getApplicationKey() );
        final MessageBundle bundle = this.localeService.getBundle( componentDescriptor.getApplicationKey(), locale );
        if ( bundle == null )
        {
            return title;
        }

        String localized;
        try
        {
            localized = bundle.localize( i18nKey );
        }
        catch ( IllegalArgumentException e )
        {
            localized = bundle.getMessage( i18nKey );
        }

        return localized != null ? localized : title;
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
    public void setLocaleService( final LocaleService localeService )
    {
        this.localeService = localeService;
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }
}
