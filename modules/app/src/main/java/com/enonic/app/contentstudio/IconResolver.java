package com.enonic.app.contentstudio;

import java.time.Instant;
import java.util.Base64;
import java.util.function.Supplier;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.resource.Resource;
import com.enonic.xp.resource.ResourceKey;
import com.enonic.xp.resource.ResourceService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;


public final class IconResolver
    implements ScriptBean
{
    private Supplier<ResourceService> resourceService;

    public String getAppIcon( final String applicationKey )
    {
        final Icon icon = doLoadIcon( ResourceKey.from( ApplicationKey.from( applicationKey ), "application.svg" ), "image/svg+xml" );

        return iconToString( icon );
    }

    public String getSchemaIcon( final String applicationKey, final String name, final String path )
    {
        final Icon icon = loadIcon( ApplicationKey.from( applicationKey ), name, path );

        return iconToString( icon );
    }

    private Icon loadIcon( final ApplicationKey applicationKey, final String name, final String folderPath )
    {
        final Icon svgIcon = doLoadIcon( toResourceKey( applicationKey, name, "png", folderPath ), "image/svg+xml" );

        if ( svgIcon != null )
        {
            return svgIcon;
        }
        else
        {
            return doLoadIcon( toResourceKey( applicationKey, name, "png", folderPath ), "image/png" );
        }
    }

    private Icon doLoadIcon( final ResourceKey resourceKey, final String mimeType )
    {
        final Resource resource = this.resourceService.get().getResource( resourceKey );

        if ( !resource.exists() )
        {
            return null;
        }

        final Instant modifiedTime = Instant.ofEpochMilli( resource.getTimestamp() );
        return Icon.from( resource.readBytes(), mimeType, modifiedTime );
    }

    private ResourceKey toResourceKey( final ApplicationKey key, final String name, final String ext, final String folderPath )
    {
        return ResourceKey.from( key, folderPath + "/" + name + "/" + name + "." + ext );
    }

    private String iconToString( final Icon icon )
    {
        if ( icon != null && icon.getMimeType() != null )
        {
            return "data:" + icon.getMimeType() + ";base64, " + Base64.getEncoder().encodeToString( icon.toByteArray() );
        }
        return null;
    }

    @Override
    public void initialize( final BeanContext context )
    {
        this.resourceService = context.getService( ResourceService.class );
    }
}
