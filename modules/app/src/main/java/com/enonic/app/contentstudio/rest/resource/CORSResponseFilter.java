package com.enonic.app.contentstudio.rest.resource;

import java.io.IOException;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@EnableCORS
public class CORSResponseFilter
    implements ContainerResponseFilter
{
    private static final String ALLOWED_HEADERS = "Origin, Accept, Content-Type, Authorization, X-Requested-With";

    private static final String ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS, HEAD";

    @Override
    public void filter( final ContainerRequestContext requestContext, final ContainerResponseContext responseContext )
        throws IOException
    {
        final String origin = requestContext.getHeaderString( "Origin" );

        responseContext.getHeaders().putSingle( "Access-Control-Allow-Origin", origin != null ? origin : "*" );
        responseContext.getHeaders().putSingle( "Access-Control-Allow-Credentials", Boolean.TRUE.toString() );
        responseContext.getHeaders().putSingle( "Access-Control-Allow-Headers", ALLOWED_HEADERS );
        responseContext.getHeaders().putSingle( "Access-Control-Allow-Methods", ALLOWED_METHODS );
    }
}
