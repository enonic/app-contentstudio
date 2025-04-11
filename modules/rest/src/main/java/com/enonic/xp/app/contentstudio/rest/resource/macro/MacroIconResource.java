package com.enonic.xp.app.contentstudio.rest.resource.macro;

import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.macro.MacroDescriptorService;
import com.enonic.xp.macro.MacroKey;
import com.enonic.xp.security.RoleKeys;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import static com.google.common.base.Strings.isNullOrEmpty;

@Path(ResourceConstants.REST_ROOT + "macro")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class MacroIconResource
    implements JaxRsComponent
{

    private MacroIconResolver macroIconResolver;

    private static final MacroImageHelper HELPER = new MacroImageHelper();

    public static final String DEFAULT_MIME_TYPE = "image/svg+xml";

    @GET
    @Path("icon/{macroKey}")
    @Produces("image/*")
    public Response getIcon( @PathParam("macroKey") final String macroKeyStr, @QueryParam("size") @DefaultValue("128") final int size,
                             @QueryParam("hash") final String hash )
        throws Exception
    {
        final MacroKey macroKey = MacroKey.from( macroKeyStr );
        final Icon icon = this.macroIconResolver.resolveIcon( macroKey );

        final Response.ResponseBuilder responseBuilder;
        if ( icon == null )
        {
            final byte[] defaultMacroImage = HELPER.getDefaultMacroImage();
            responseBuilder = Response.ok( defaultMacroImage, DEFAULT_MIME_TYPE );
            applyMaxAge( Integer.MAX_VALUE, responseBuilder );
        }
        else
        {
            final byte[] image = HELPER.readIconImage( icon, size );
            responseBuilder = Response.ok( image, icon.getMimeType() );
            if ( !isNullOrEmpty( hash ) )
            {
                applyMaxAge( Integer.MAX_VALUE, responseBuilder );
            }
        }

        return responseBuilder.build();
    }

    private void applyMaxAge( int maxAge, final Response.ResponseBuilder responseBuilder )
    {
        final CacheControl cacheControl = new CacheControl();
        cacheControl.setMaxAge( maxAge );
        responseBuilder.cacheControl( cacheControl );
    }

    @Reference
    public void setMacroDescriptorService( final MacroDescriptorService macroDescriptorService )
    {
        this.macroIconResolver = new MacroIconResolver(macroDescriptorService);
    }

}
