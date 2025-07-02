package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Set;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.io.ByteSource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.Response;

import com.enonic.xp.attachment.Attachment;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.Media;
import com.enonic.xp.icon.Thumbnail;
import com.enonic.xp.image.Cropping;
import com.enonic.xp.image.ImageService;
import com.enonic.xp.image.ReadImageParams;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.media.ImageOrientation;
import com.enonic.xp.media.MediaInfoService;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.util.BinaryReference;

import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;
import static com.google.common.base.Strings.isNullOrEmpty;

@Path(REST_ROOT + "{content:(content|" + CONTENT_CMS_PATH + "/content)}/icon")
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class ContentIconResource
    implements JaxRsComponent
{
    // In sync with ImageHandler
    private static final int DEFAULT_QUALITY = 85;

    private ContentService contentService;

    private MediaInfoService mediaInfoService;

    private ImageService imageService;

    private static final Set<String> SKIP_IMAGE_MIME_TYPES = Set.of( "image/webp", "image/avif", "image/gif", "image/svg+xml" );

    @GET
    @Path("{contentId}")
    public Response getContentIcon( @PathParam("contentId") final String contentIdAsString,
                                    @QueryParam("size") @DefaultValue("128") final int size,
                                    @QueryParam("crop") @DefaultValue("true") final boolean crop, @QueryParam("ts") final String timestamp )
        throws Exception
    {

        if ( contentIdAsString == null )
        {
            throw new WebApplicationException( Response.Status.BAD_REQUEST );
        }

        final ContentId contentId = ContentId.from( contentIdAsString );
        final Content content = contentService.getById( contentId );
        if ( content == null )
        {
            throw new WebApplicationException( Response.Status.NOT_FOUND );
        }

        final ResolvedImage imageResolvedFromThumbnail = resolveResponseFromThumbnail( content, size, crop );

        if ( imageResolvedFromThumbnail.isOK() )
        {
            return cacheAndReturnResponse( timestamp, imageResolvedFromThumbnail );
        }

        if ( content instanceof final Media media && media.isImage() )
        {
            final ResolvedImage imageResolvedFromAttachment = resolveResponseFromImageAttachment( media, size, crop );

            if ( imageResolvedFromAttachment.isOK() )
            {
                return imageResolvedFromAttachment.toResponse();
            }
        }

        throw new WebApplicationException( Response.Status.NOT_FOUND );
    }

    private ResolvedImage resolveResponseFromThumbnail( final Content content, final int size, final boolean crop )
    {
        final Thumbnail contentThumbnail = content.getThumbnail();

        if ( contentThumbnail != null )
        {
            final ResolveIconParams params = new ResolveIconParams().
                setBinaryReference( contentThumbnail.getBinaryReference() ).
                setId( content.getId() ).
                setImageOrientation( getThumbnailOrientation( contentThumbnail, content ) ).
                setMimeType( contentThumbnail.getMimeType() ).
                setSize( size ).
                setCrop( crop );

            return this.resolveResponse( params );

        }
        return ResolvedImage.unresolved();
    }

    private ResolvedImage resolveResponseFromImageAttachment( final Media media, final int size, final boolean crop )
    {
        final Attachment imageAttachment = media.getMediaAttachment();

        if ( imageAttachment != null )
        {
            final ResolveIconParams params = new ResolveIconParams().
                setBinaryReference( imageAttachment.getBinaryReference() ).
                setId( media.getId() ).
                setImageOrientation( media.getOrientation() ).
                setCropping( media.getCropping() ).
                setMimeType( imageAttachment.getMimeType() ).
                setFileName( imageAttachment.getName() ).
                setSize( size ).
                setCrop( crop );

            return this.resolveResponse( params );
        }
        return ResolvedImage.unresolved();
    }

    private ResolvedImage resolveResponse( final ResolveIconParams params )
    {
        try
        {
            if ( params.mimeType.equals( "image/svg+xml" ) || params.mimeType.equals( "image/gif" ) ||
                params.mimeType.equals( "image/avif" ) || params.mimeType.equals( "image/webp" ) )
            {
                final ByteSource binary = contentService.getBinary( params.id, params.binaryReference );
                final boolean gzip = params.fileName != null && params.fileName.toLowerCase().endsWith( ".svgz" );
                return new ResolvedImage( binary, params.mimeType, gzip );
            }
            else
            {
                final ReadImageParams readImageParams = ReadImageParams.newImageParams().
                    contentId( params.id ).
                    binaryReference( params.binaryReference ).
                    cropping( params.cropping ).
                    scaleSize( params.size ).
                    scaleSquare( params.crop ).
                    mimeType( params.mimeType ).
                    quality( DEFAULT_QUALITY ).
                    orientation( params.imageOrientation ).
                    build();

                final ByteSource contentImage = imageService.readImage( readImageParams );
                return new ResolvedImage( contentImage, params.mimeType );
            }

        }
        catch ( IOException e )
        {
            throw new UncheckedIOException( e );
        }
    }

    private static class ResolveIconParams
    {
        private ContentId id;

        private BinaryReference binaryReference;

        private ImageOrientation imageOrientation;

        private Cropping cropping;

        private String mimeType;

        private Integer size;

        private Boolean crop;

        private String fileName;

        public ResolveIconParams setId( final ContentId id )
        {
            this.id = id;
            return this;
        }

        public ResolveIconParams setBinaryReference( final BinaryReference binaryReference )
        {
            this.binaryReference = binaryReference;
            return this;
        }

        public ResolveIconParams setImageOrientation( final ImageOrientation imageOrientation )
        {
            this.imageOrientation = imageOrientation;
            return this;
        }

        public ResolveIconParams setCropping( final Cropping cropping )
        {
            this.cropping = cropping;
            return this;
        }

        public ResolveIconParams setMimeType( final String mimeType )
        {
            this.mimeType = mimeType;
            return this;
        }

        public ResolveIconParams setSize( final Integer size )
        {
            this.size = size;
            return this;
        }

        public ResolveIconParams setCrop( final Boolean crop )
        {
            this.crop = crop;
            return this;
        }

        public ResolveIconParams setFileName( final String fileName )
        {
            this.fileName = fileName;
            return this;
        }
    }

    private ImageOrientation getThumbnailOrientation( final Thumbnail thumbnail, final Content content )
    {
        if ( SKIP_IMAGE_MIME_TYPES.contains( thumbnail.getMimeType() ) )
        {
            return ImageOrientation.DEFAULT;
        }

        final ByteSource sourceBinary = contentService.getBinary( content.getId(), thumbnail.getBinaryReference() );
        return mediaInfoService.getImageOrientation( sourceBinary );
    }

    private Response cacheAndReturnResponse( final String timestamp, final ResolvedImage resolvedImage )
    {
        final boolean cacheForever = !isNullOrEmpty( timestamp );
        if ( cacheForever )
        {
            final CacheControl cacheControl = new CacheControl();
            cacheControl.setMaxAge( Integer.MAX_VALUE );
            return resolvedImage.toResponse( cacheControl );
        }
        else
        {
            return resolvedImage.toResponse();
        }
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }

    @Reference
    public void setMediaInfoService( final MediaInfoService mediaInfoService )
    {
        this.mediaInfoService = mediaInfoService;
    }

    @Reference
    public void setImageService( final ImageService imageService )
    {
        this.imageService = imageService;
    }
}
