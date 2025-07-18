package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.io.IOException;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.io.ByteSource;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.CacheControl;
import jakarta.ws.rs.core.Response;

import com.enonic.xp.attachment.Attachment;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.ExtraData;
import com.enonic.xp.content.Media;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.data.Property;
import com.enonic.xp.exception.ThrottlingException;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.image.Cropping;
import com.enonic.xp.image.FocalPoint;
import com.enonic.xp.image.ImageService;
import com.enonic.xp.image.ReadImageParams;
import com.enonic.xp.image.ScaleParams;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.media.ImageOrientation;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.schema.xdata.XDataName;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.util.Exceptions;
import com.enonic.xp.web.HttpStatus;
import com.enonic.xp.web.WebException;

import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;

@Path(REST_ROOT + "{content:(content|" + CONTENT_CMS_PATH + "/content)}/image")
@Produces("image/*")
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class ContentImageResource
    implements JaxRsComponent
{
    // In sync with ImageHandler
    private static final int DEFAULT_QUALITY = 85;

    private static final ContentImageHelper HELPER = new ContentImageHelper();

    private ContentTypeService contentTypeService;

    private ContentService contentService;

    private ImageService imageService;

    @GET
    @Path("{contentId}")
    public Response getContentImage( @PathParam("contentId") final String contentIdAsString,
                                     @QueryParam("size") @DefaultValue("0") final int size,
                                     @QueryParam("scaleWidth") @DefaultValue("false") final boolean scaleWidth,
                                     @QueryParam("source") @DefaultValue("false") final boolean source,
                                     @QueryParam("scale") final String scale, @QueryParam("filter") final String filter,
                                     @QueryParam("crop") @DefaultValue("true") final boolean crop )
        throws Exception
    {
        if ( contentIdAsString == null )
        {
            throw new WebApplicationException( Response.Status.BAD_REQUEST );
        }

        final ContentId contentId = ContentId.from( contentIdAsString );
        final Content content = ContextBuilder.copyOf(ContextAccessor.current()).branch(ContentConstants.BRANCH_DRAFT).build().callWith(() -> contentService.getById( contentId ));
        if ( content == null )
        {
            throw new WebApplicationException( Response.Status.NOT_FOUND );
        }

        ResolvedImage resolvedImage;

        if ( content instanceof Media )
        {
            if ( content.getType().isVectorMedia() )
            {
                resolvedImage = resolveResponseFromContentSVGAttachment( (Media) content );
            }
            else
            {
                resolvedImage = resolveResponseFromContentImageAttachment( (Media) content, size, scaleWidth, source, scale, filter, crop );
            }
            if ( resolvedImage.isOK() )
            {
                final CacheControl cacheControl = new CacheControl();
                cacheControl.setMaxAge( Integer.MAX_VALUE );
                return resolvedImage.toResponse( cacheControl );
            }
        }

        resolvedImage = resolveResponseFromContentType( content, size );
        if ( resolvedImage.isOK() )
        {
            return resolvedImage.toResponse();
        }
        else
        {
            throw new WebApplicationException( Response.Status.NOT_FOUND );
        }
    }

    private ResolvedImage resolveResponseFromContentSVGAttachment( final Media media )
    {
        final Attachment attachment = media.getMediaAttachment();
        if ( attachment != null )
        {
            final ByteSource binary = contentService.getBinary( media.getId(), attachment.getBinaryReference() );
            if ( binary != null )
            {
                final boolean gzip = attachment.getName() != null && attachment.getName().toLowerCase().endsWith( ".svgz" );
                return new ResolvedImage( binary, attachment.getMimeType(), gzip );
            }
        }
        return ResolvedImage.unresolved();
    }

    private ResolvedImage resolveResponseFromContentImageAttachment( final Media media, final int size, final boolean scaleWidth,
                                                                     final boolean source, final String scale, final String filter,
                                                                     final boolean crop )
    {
        final Attachment attachment = media.getMediaAttachment();
        if ( attachment != null )
        {
            final ByteSource binary = contentService.getBinary( media.getId(), attachment.getBinaryReference() );
            if ( binary != null )
            {
                try
                {
                    final String mimeType = attachment.getMimeType();

                    if ( mimeType.equals( "image/gif" ) || mimeType.equals( "image/avif" ) || mimeType.equals( "image/webp" ) ||
                        mimeType.equals( "image/svg+xml" ) )
                    {
                        return new ResolvedImage( binary, mimeType );
                    }

                    final Cropping cropping = ( !source && crop ) ? media.getCropping() : null;
                    final ImageOrientation imageOrientation = source ? null : media.getOrientation();
                    final FocalPoint focalPoint = source ? null : media.getFocalPoint();
                    final int sizeParam = ( size > 0 ) ? size : ( source ? 0 : getOriginalWidth( media ) );
                    final ScaleParams scaleParam = parseScaleParam( media, scale, sizeParam );

                    final ReadImageParams readImageParams = ReadImageParams.newImageParams().
                        contentId( media.getId() ).
                        binaryReference( attachment.getBinaryReference() ).
                        cropping( cropping ).
                        scaleParams( scaleParam ).
                        focalPoint( focalPoint ).
                        scaleSize( sizeParam ).
                        scaleWidth( scaleWidth ).
                        mimeType( mimeType ).
                        quality( DEFAULT_QUALITY ).
                        orientation( imageOrientation ).filterParam( filter ).build();

                    final ByteSource contentImage = imageService.readImage( readImageParams );
                    return new ResolvedImage( contentImage, mimeType );
                }
                catch ( IOException e )
                {
                    throw Exceptions.unchecked( e );
                }
                catch ( ThrottlingException e )
                {
                    throw new WebException( HttpStatus.TOO_MANY_REQUESTS, "Try again later", e );
                }
            }
        }
        return ResolvedImage.unresolved();
    }

    private ResolvedImage resolveResponseFromContentType( final Content content, final int size )
        throws IOException
    {
        final ContentType superContentTypeWithIcon = resolveSuperContentTypeWithIcon( content.getType() );
        if ( superContentTypeWithIcon == null || superContentTypeWithIcon.getIcon() == null )
        {
            return ResolvedImage.unresolved();
        }
        final Icon icon = superContentTypeWithIcon.getIcon();

        final String mimeType = icon.getMimeType();
        final byte[] contentImage = HELPER.readIconImage( icon, size );

        return new ResolvedImage( ByteSource.wrap( contentImage ), mimeType );
    }

    private ContentType resolveSuperContentTypeWithIcon( final ContentTypeName contentTypeName )
    {
        ContentType contentType = getContentType( contentTypeName );
        while ( contentType != null && contentType.getIcon() == null )
        {
            contentType = getContentType( contentType.getSuperType() );
        }
        return contentType;
    }

    private ContentType getContentType( final ContentTypeName contentTypeName )
    {
        if ( contentTypeName == null )
        {
            return null;
        }
        return contentTypeService.getByName( new GetContentTypeParams().contentTypeName( contentTypeName ) );
    }

    private ScaleParams parseScaleParam( final Media media, final String scale, final int size )
    {
        if ( scale == null )
        {
            return null;
        }

        final int pos = scale.indexOf( ":" );
        final String horizontalProportion = scale.substring( 0, pos );
        final String verticalProportion = scale.substring( pos + 1 );

        final int width = size > 0 ? size : getOriginalWidth( media );
        final int height = width / Integer.parseInt( horizontalProportion ) * Integer.parseInt( verticalProportion );

        return new ScaleParams( "block", new Object[]{width, height} );
    }

    private int getOriginalWidth( final Media media )
    {
        ExtraData imageData = media.getAllExtraData().getMetadata( XDataName.from( "media:imageInfo" ) );
        if ( imageData != null )
        {
            final Property imageWidthProp = imageData.getData().getProperty( "imageWidth" );

            if (imageWidthProp != null) {
                return imageWidthProp.getValue().asLong().intValue();
            }
        }

        return 0;
    }

    @Reference
    public void setContentTypeService( final ContentTypeService contentTypeService )
    {
        this.contentTypeService = contentTypeService;
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }

    @Reference
    public void setImageService( final ImageService imageService )
    {
        this.imageService = imageService;
    }
}
