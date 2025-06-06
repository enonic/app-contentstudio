package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.io.IOException;
import java.io.UncheckedIOException;

import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.Response;

import com.google.common.io.ByteSource;

public final class ResolvedImage
{
    final ByteSource image;

    final String mimeType;

    final boolean gzip;

    public ResolvedImage( final ByteSource image, final String mimeType )
    {
        this.image = image;
        this.mimeType = mimeType;
        this.gzip = false;
    }

    public ResolvedImage( final ByteSource image, final String mimeType, final boolean gzip )
    {
        this.image = image;
        this.mimeType = mimeType;
        this.gzip = gzip;
    }

    public static ResolvedImage unresolved()
    {
        return new ResolvedImage( null, null );
    }

    public boolean isOK()
    {
        return image != null && mimeType != null;
    }

    private Response.ResponseBuilder newResponse()
    {
        final Response.ResponseBuilder r;
        try
        {
            r = Response.ok( image.openBufferedStream(), mimeType );
        }
        catch ( IOException e )
        {
            throw new UncheckedIOException( e );
        }
        if ( gzip )
        {
            r.encoding( "gzip" );
        }

        if ( "image/svg+xml".equals( mimeType ) )
        {
            r.header( "Content-Security-Policy",
                      "default-src 'none'; base-uri 'none'; form-action 'none'; style-src 'self' 'unsafe-inline'" );
        }
        else
        {
            r.header( "Content-Security-Policy", "default-src 'none'; base-uri 'none'; form-action 'none'" );
        }

        return r;
    }

    public Response toResponse()
    {
        return newResponse().build();
    }

    public Response toResponse( final CacheControl cc )
    {
        return newResponse().cacheControl( cc ).build();
    }
}
