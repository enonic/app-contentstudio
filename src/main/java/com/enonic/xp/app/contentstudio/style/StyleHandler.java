package com.enonic.xp.app.contentstudio.style;

import java.util.LinkedHashSet;
import java.util.Set;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationKeys;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.layer.ContentLayerName;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.site.Site;
import com.enonic.xp.style.StyleDescriptorService;
import com.enonic.xp.style.StyleDescriptors;

public final class StyleHandler
    implements ScriptBean
{
    private static final ApplicationKey SYSTEM_APPLICATION_KEY = ApplicationKey.from( "com.enonic.xp.app.system" );

    private StyleDescriptorService styleDescriptorService;

    private ContentService contentService;

    private LocaleService localeService;

    private String contentId;

    private String layer;

    public StyleDescriptorMapper getStyles()
    {
        final ApplicationKeys applicationKeys = resolveKeysFromApps();

        final StyleDescriptors styles = this.styleDescriptorService.getByApplications( applicationKeys );

        return new StyleDescriptorMapper( styles, localeService );
    }

    private ApplicationKeys resolveKeysFromApps()
    {
        final ContentId contentId = ContentId.from( this.contentId );

        final Set<ApplicationKey> keys = new LinkedHashSet<>();
        keys.add( SYSTEM_APPLICATION_KEY );

        final Context context = ContextBuilder.
            from( ContextAccessor.current() ).
            branch( ContentLayerName.from( layer ).getDraftBranch() ).
            build();
        ContextAccessor.INSTANCE.set( context );

        final Site site = this.contentService.getNearestSite( contentId );

        if ( site != null )
        {
            site.getSiteConfigs().stream().filter( siteConfig -> !isSystemApp( siteConfig.getApplicationKey() ) ).forEach(
                siteConfig -> keys.add( siteConfig.getApplicationKey() ) );
        }

        return ApplicationKeys.from( keys );
    }

    private boolean isSystemApp( final ApplicationKey key )
    {
        return ApplicationKey.SYSTEM_RESERVED_APPLICATION_KEYS.contains( key );
    }

    public void setContentId( final String contentId )
    {
        this.contentId = contentId;
    }

    public void setLayer( final String layer )
    {
        this.layer = layer;
    }

    @Override
    public void initialize( final BeanContext context )
    {
        styleDescriptorService = context.getService( StyleDescriptorService.class ).get();
        contentService = context.getService( ContentService.class ).get();
        localeService = context.getService( LocaleService.class ).get();
    }

}
