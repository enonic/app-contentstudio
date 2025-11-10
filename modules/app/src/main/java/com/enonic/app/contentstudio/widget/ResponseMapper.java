package com.enonic.app.contentstudio.widget;

import java.util.Map;

import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;

import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

public final class ResponseMapper
    implements MapSerializable
{
    private final Response response;

    public ResponseMapper( final Response response )
    {
        this.response = response;
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        gen.value( "status", this.response.getStatus() );
        gen.value( "mimeType", this.response.getMediaType() );
        gen.value( "body", this.response.getEntity() );
        serializeHeaders( gen );
        serializeCookies( gen );
    }

    private void serializeHeaders( final MapGenerator gen )
    {
        final MultivaluedMap<String, Object> headers = response.getHeaders();
        if ( headers.isEmpty() )
        {
            return;
        }
        gen.map( "headers" );

        headers.forEach( ( key, values ) -> {
            if ( values.size() == 1 )
            {
                gen.value( key, values.getFirst() );
            }
            else
            {
                gen.array( key );
                values.forEach( gen::value );
                gen.end();
            }
        } );

        gen.end();
    }


    private void serializeCookies( final MapGenerator gen )
    {
        final Map<String, NewCookie> cookies = response.getCookies();
        if ( cookies.isEmpty() )
        {
            return;
        }
        gen.map( "cookies" );

        cookies.forEach( ( key, cookie ) -> {
            gen.map( key );
            gen.value( "value", cookie.getValue() );
            gen.value( "path", cookie.getPath() );
            gen.value( "domain", cookie.getDomain() );
            gen.value( "comment", cookie.getComment() );
            gen.value( "maxAge", cookie.getMaxAge() );
            gen.value( "secure", cookie.isSecure() );
            gen.value( "httpOnly", cookie.isHttpOnly() );
            gen.end();
        } );

        gen.end();
    }
}

