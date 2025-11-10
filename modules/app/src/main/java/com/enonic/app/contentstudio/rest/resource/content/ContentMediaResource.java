package com.enonic.app.contentstudio.rest.resource.content;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.io.ByteSource;

import com.enonic.xp.attachment.Attachment;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.Media;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.schema.content.ContentTypeFromMimeTypeResolver;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeNames;
import com.enonic.xp.security.RoleKeys;

import static com.enonic.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;
import static com.enonic.xp.web.servlet.ServletRequestUrlHelper.contentDispositionAttachment;
import static com.google.common.base.Strings.isNullOrEmpty;
import static com.google.common.base.Strings.nullToEmpty;

@SuppressWarnings("UnusedDeclaration")
@Path(REST_ROOT + "{content:(content|" + CONTENT_CMS_PATH + "/content)}/media")
@Produces(MediaType.APPLICATION_OCTET_STREAM)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class ContentMediaResource
    implements JaxRsComponent
{
    private ContentService contentService;

    private static final Set<String> ALLOWED_PREVIEW_TYPES =
        Stream.concat( ContentTypeFromMimeTypeResolver.resolveMimeTypes(
                           ContentTypeNames.from( ContentTypeName.audioMedia(), ContentTypeName.videoMedia(),
                                                  ContentTypeName.textMedia(), ContentTypeName.imageMedia(),
                                                  ContentTypeName.vectorMedia() ) ).stream(),
                       Set.of( "application/pdf", "application/postscript" ).stream() )
            .collect( Collectors.toSet() );

    @GET
    @Path("{contentId}")
    public Response media( @PathParam("contentId") final String contentIdAsString,
                           @QueryParam("download") @DefaultValue("true") final boolean download )
        throws IOException
    {
        final ContentId contentId = ContentId.from( contentIdAsString );
        return doServeMedia( contentId, null, download );
    }

    @GET
    @Path("{contentId}/{identifier}")
    public Response media( @PathParam("contentId") final String contentIdAsString, @PathParam("identifier") final String identifier,
                           @QueryParam("download") @DefaultValue("true") final boolean download )
        throws IOException
    {
        final ContentId contentId = ContentId.from( contentIdAsString );
        return doServeMedia( contentId, identifier, download );
    }

    private Response doServeMedia( final ContentId contentId, final String identifier, final Boolean download )
        throws IOException
    {

        final Attachment attachment = resolveAttachment( identifier, contentId );
        if ( attachment == null )
        {
            throw new WebApplicationException( String.format( "Content [%s] has no attachments", contentId ), Response.Status.NOT_FOUND );
        }
        else if ( !download && !attachmentAllowsPreview( attachment ) )
        {
            throw new WebApplicationException( String.format( "Preview for attachment [%s] is not supported", attachment.getName() ) );
        }

        final ByteSource binary = contentService.getBinary( contentId, attachment.getBinaryReference() );
        Response.ResponseBuilder response = Response.ok( binary.openStream(), attachment.getMimeType() );

        if ( download )
        {
            final String fileName = attachment.getName();
            if ( !isNullOrEmpty( fileName ) )
            {
                response = response.header( "Content-Disposition", contentDispositionAttachment( fileName ) );
            }
        }
        else
        {
            response = response.header( "X-Frame-Options", "SAMEORIGIN" );
        }

        response.header( "Content-Security-Policy", "default-src 'none'; base-uri 'none'; form-action 'none'" );

        return response.build();
    }

    private Boolean attachmentAllowsPreview( final Attachment attachment )
    {
        return ALLOWED_PREVIEW_TYPES.contains( attachment.getMimeType() );
    }

    private Attachment resolveAttachment( final String identifier, final ContentId contentId )
    {
        final Content content = contentService.getById( contentId );

        if ( content == null )
        {
            throw new WebApplicationException( String.format( "Content [%s] was not found", contentId ), Response.Status.NOT_FOUND );
        }

        final String decodedIdentifier =
            nullToEmpty( identifier ).isBlank() ? identifier : URLDecoder.decode( identifier, StandardCharsets.UTF_8 );

        return resolveAttachment( decodedIdentifier, content );
    }

    private Attachment resolveAttachment( final String identifier, final Content content )
    {
        Attachment attachment = null;
        if ( !isNullOrEmpty( identifier ) )
        {
            attachment = content.getAttachments().byName( identifier );
            if ( attachment == null )
            {
                attachment = content.getAttachments().byLabel( identifier );
            }
        }
        if ( content.getType().isDescendantOfMedia() && attachment == null )
        {
            attachment = ( (Media) content ).getSourceAttachment();
        }
        return attachment;
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }
}
