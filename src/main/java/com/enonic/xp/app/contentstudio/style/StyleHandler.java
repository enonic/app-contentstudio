package com.enonic.xp.app.contentstudio.style;

import java.util.LinkedHashSet;
import java.util.Set;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationKeys;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
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

    public StyleDescriptorMapper getStyles()
    {
        final ContentId contentId = ContentId.from( this.contentId );

        final ApplicationKey contentTypeApp = resolveContentTypeApp( contentId );
        final Set<ApplicationKey> keys = new LinkedHashSet<>();
        keys.add( SYSTEM_APPLICATION_KEY );
        if ( contentTypeApp != null && !isSystemApp( contentTypeApp ) )
        {
            keys.add( contentTypeApp );
        }

        final StyleDescriptors styles = this.styleDescriptorService.getByApplications( ApplicationKeys.from( keys ) );

        return new StyleDescriptorMapper( styles, localeService );
    }

    private ApplicationKey resolveContentTypeApp( final ContentId contentId )
    {
        try
        {
            final Content content = this.contentService.getById( contentId );
            return content.getType().getApplicationKey();
        }
        catch ( ContentNotFoundException e )
        {
            return null;
        }
    }

    private boolean isSystemApp( final ApplicationKey key )
    {
        return ApplicationKey.SYSTEM_RESERVED_APPLICATION_KEYS.contains( key );
    }

    public void setContentId( final String contentId )
    {
        this.contentId = contentId;
    }

    @Override
    public void initialize( final BeanContext context )
    {
        styleDescriptorService = context.getService( StyleDescriptorService.class ).get();
        contentService = context.getService( ContentService.class ).get();
        localeService = context.getService( LocaleService.class ).get();
    }

}
