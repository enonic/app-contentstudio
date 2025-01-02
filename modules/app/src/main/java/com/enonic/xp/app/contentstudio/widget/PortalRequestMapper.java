package com.enonic.xp.app.contentstudio.widget;

import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;

import com.enonic.xp.portal.PortalRequest;
import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

public final class PortalRequestMapper
    implements MapSerializable
{
    private final PortalRequest request;

    public PortalRequestMapper( final PortalRequest request )
    {
        this.request = request;
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        gen.value( "method", this.request.getMethod() );
        gen.value( "scheme", this.request.getScheme() );
        gen.value( "host", this.request.getHost() );
        gen.value( "port", this.request.getPort() );
        gen.value( "path", this.request.getPath() );
        gen.value( "rawPath", this.request.getRawPath() );
        gen.value( "url", this.request.getUrl() );
        gen.value( "remoteAddress", this.request.getRemoteAddress() );
        gen.value( "mode", Objects.toString( this.request.getMode(), null ) );
        gen.value( "webSocket", this.request.isWebSocket() );

        if ( this.request.isValidTicket() != null )
        {
            gen.value( "validTicket", this.request.isValidTicket() );
        }

        if ( this.request.getRepositoryId() != null )
        {
            gen.value( "repositoryId", this.request.getRepositoryId().toString() );
        }

        if ( this.request.getBranch() != null )
        {
            gen.value( "branch", this.request.getBranch().getValue() );
        }

        if ( this.request.getContextPath() != null )
        {
            gen.value( "contextPath", this.request.getContextPath() );
        }

        serializeBody( gen );
        serializeMultimap( "params", gen, this.request.getParams().asMap() );
        gen.value( "headers", this.request.getHeaders() );
        gen.value( "getHeader", (Function<String, String>) s -> request.getHeaders().get( s ) );
        gen.value( "cookies", this.request.getCookies() );
    }

    private void serializeBody( final MapGenerator gen )
    {
        if ( this.request.getContentType() == null )
        {
            return;
        }

        gen.value( "contentType", this.request.getContentType() );
        gen.value( "body", this.request.getBodyAsString() );
    }

    private void serializeMultimap( final String name, final MapGenerator gen,
                                    final Map<String, ? extends Collection<String>> params )
    {
        gen.map( name );
        params.forEach( ( key, values ) -> {
            if ( values.size() == 1 )
            {
                gen.value( key, values.iterator().next() );
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
}
