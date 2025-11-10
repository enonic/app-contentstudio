package com.enonic.app.contentstudio.rest.resource.schema;

import com.google.common.hash.Hashing;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.icon.Icon;
import com.enonic.xp.web.servlet.ServletRequestUrlHelper;

public abstract class IconUrlResolver
{
    private final HttpServletRequest request;

    protected IconUrlResolver( final HttpServletRequest request )
    {
        this.request = request;
    }

    protected String generateIconUrl( final String baseUrl, final Icon icon )
    {
        final StringBuilder str = new StringBuilder( baseUrl );
        if ( icon != null )
        {
            final byte[] iconData = icon.toByteArray();
            if ( iconData != null && iconData.length > 0 )
            {
                str.append( "?hash=" ).append( Hashing.md5().hashBytes( iconData ).toString() );
            }
        }
        return ServletRequestUrlHelper.createUri( request, str.toString() );
    }

}
