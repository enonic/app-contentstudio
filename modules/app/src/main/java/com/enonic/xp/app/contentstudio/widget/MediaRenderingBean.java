package com.enonic.xp.app.contentstudio.widget;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.CacheControl;
import javax.ws.rs.core.Response;

import com.google.common.io.ByteSource;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentImageHelper;
import com.enonic.xp.attachment.Attachment;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.ExtraData;
import com.enonic.xp.content.Media;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.exception.ThrottlingException;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.image.Cropping;
import com.enonic.xp.image.FocalPoint;
import com.enonic.xp.image.ImageService;
import com.enonic.xp.image.ReadImageParams;
import com.enonic.xp.image.ScaleParams;
import com.enonic.xp.media.ImageOrientation;
import com.enonic.xp.media.MediaInfoService;
import com.enonic.xp.node.NodePath;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeFromMimeTypeResolver;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeNames;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.schema.xdata.XDataName;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.User;
import com.enonic.xp.security.auth.AuthenticationInfo;
import com.enonic.xp.util.Exceptions;
import com.enonic.xp.web.HttpStatus;
import com.enonic.xp.web.WebException;

import static com.enonic.xp.archive.ArchiveConstants.ARCHIVE_ROOT_PATH;
import static com.enonic.xp.content.ContentConstants.CONTENT_ROOT_PATH;
import static com.enonic.xp.content.ContentConstants.CONTENT_ROOT_PATH_ATTRIBUTE;
import static com.enonic.xp.web.servlet.ServletRequestUrlHelper.contentDispositionAttachment;
import static com.google.common.base.Strings.isNullOrEmpty;
import static com.google.common.base.Strings.nullToEmpty;

public class MediaRenderingBean
    implements ScriptBean
{
    private static final int DEFAULT_QUALITY = 85;

    private static final ContentImageHelper HELPER = new ContentImageHelper();

    private Supplier<ContentService> contentServiceSupplier;

    private Supplier<ImageService> imageServiceSupplier;

    private Supplier<ContentTypeService> contentTypeServiceSupplier;

    private Supplier<MediaInfoService> mediaInfoServiceSupplier;

    private static final Set<String> MEDIA_ATTACHMENT_TYPES =
        Stream.concat(
            ContentTypeFromMimeTypeResolver.resolveMimeTypes(
                ContentTypeNames.from( ContentTypeName.audioMedia(), ContentTypeName.videoMedia(),
                                       ContentTypeName.documentMedia(),
                                       ContentTypeName.textMedia(), ContentTypeName.imageMedia(),
                                       ContentTypeName.vectorMedia() ) ).stream(),

            Set.of( "application/pdf", "application/postscript", "image/webp", "image/avif",
                    "application/json", "application/javascript", "application/ecmascript", "text/javascript",
                    "text/html", "text/css" ).stream()

        ).filter( t -> !t.equals( "video/avi" ) ).collect( Collectors.toSet() );

    private static final Set<String> SKIP_IMAGE_MIME_TYPES = Set.of( "image/webp", "image/avif", "image/gif" );

    private static final ContentTypeNames IMAGE_CONTENT_TYPES =
        ContentTypeNames.from( ContentTypeName.imageMedia(), ContentTypeName.vectorMedia() );

    public boolean canRender( final String contentId, final String repository, final String branch, final boolean archive )
    {
        return runInAdminContext( repository, branch, archive, () -> canRenderInContext( contentId ) );
    }

    public boolean isImageContent( final String contentType )
    {
        final ContentTypeName name = ContentTypeName.from( contentType );
        return IMAGE_CONTENT_TYPES.contains( name );
    }

    @Override
    public void initialize( final BeanContext beanContext )
    {
        this.contentServiceSupplier = beanContext.getService( ContentService.class );
        this.imageServiceSupplier = beanContext.getService( ImageService.class );
        this.contentTypeServiceSupplier = beanContext.getService( ContentTypeService.class );
        this.mediaInfoServiceSupplier = beanContext.getService( MediaInfoService.class );
    }

    public Object image( final String id, final String repository, final String branch, final boolean archive )
        throws IOException
    {
        return image( id, repository, branch, archive, 0 );
    }

    public Object image( final String id, final String repository, final String branch, final boolean archive, final Integer size )
        throws IOException
    {
        return image( id, repository, branch, archive, size, false, false, null, null, true );
    }

    public Object image( final String id, final String repository, final String branch, final boolean archive, final Integer size,
                         final boolean scaleWidth, final boolean source, final String scale, final String filter, final boolean crop )
    {
        return runInAdminContext( repository, branch, archive, () -> serveImage( id, size, scaleWidth, source, scale, filter, crop ) );
    }

    public Object media( final String id, final String repository, final String branch, final boolean archive )
    {
        return media( id, repository, branch, archive, null, false );
    }

    public Object media( final String id, final String repository, final String branch, final boolean archive, final String identifier,
                         final boolean download )
    {
        return runInAdminContext( repository, branch, archive, () -> serveMedia( id, identifier, download ) );
    }

    private <T> T runInAdminContext( final String repository, final String branch, final boolean archive, Callable<T> func )
    {
        final User superUser = User.create().key( PrincipalKey.ofSuperUser() ).login( PrincipalKey.ofSuperUser().getId() ).build();

        final AuthenticationInfo authInfo = AuthenticationInfo.create().principals( RoleKeys.ADMIN ).user( superUser ).build();

        NodePath rootPath = archive ? ARCHIVE_ROOT_PATH : CONTENT_ROOT_PATH;

        return ContextBuilder
            .copyOf( ContextAccessor.current() )
            .attribute( CONTENT_ROOT_PATH_ATTRIBUTE, rootPath )
            .branch( branch )
            .repositoryId( repository )
            .authInfo( authInfo )
            .build().callWith( func );
    }

    private boolean canRenderInContext( final String contentId )
    {
        final Content content = contentServiceSupplier.get().getById( ContentId.from( contentId ) );
        if ( content == null )
        {
            return false;
        }

        if ( IMAGE_CONTENT_TYPES.contains( content.getType() ) )
        {
            return true;
        }

        final Attachment attachment = resolveAttachment( null, content );
        return ( attachment != null && MEDIA_ATTACHMENT_TYPES.contains( attachment.getMimeType() ) );
    }

    private Object serveImage( final String id, final Integer size,
                               final boolean scaleWidth,
                               final boolean source,
                               final String scale, final String filter, final boolean crop )
        throws IOException
    {
        final ContentId contentId = ContentId.from( id );

        final Content content = contentServiceSupplier.get().getById( contentId );

        if ( content == null )
        {
            throw new WebApplicationException( String.format( "Content [%s] was not found", contentId ), Response.Status.NOT_FOUND );
        }

        Response.ResponseBuilder responseBuilder;

        if ( content instanceof Media )
        {
            final Attachment attachment = ( (Media) content ).getMediaAttachment();
            final ByteSource binary = this.contentServiceSupplier.get().getBinary( content.getId(), attachment.getBinaryReference() );

            if ( content.getType().isVectorMedia() )
            {
                responseBuilder = resolveResponseFromContentSVGAttachment( attachment, binary );
            }
            else
            {
                responseBuilder =
                    resolveResponseFromContentImageAttachment( (Media) content, attachment, binary, size, scaleWidth, source, scale, filter,
                                                               crop );
            }
            if ( responseBuilder != null )
            {
                final CacheControl cacheControl = new CacheControl();
                cacheControl.setMaxAge( Integer.MAX_VALUE );
                return new ResponseMapper( responseBuilder.cacheControl( cacheControl ).build() );
            }
        }

        responseBuilder = resolveResponseFromContentType( content, size );
        if ( responseBuilder != null )
        {
            return new ResponseMapper( responseBuilder.build() );
        }

        throw new WebApplicationException( Response.Status.NOT_FOUND );
    }

    private Response.ResponseBuilder resolveResponseFromContentType( final Content content, final int size )
        throws IOException
    {
        final ContentType superContentTypeWithIcon = resolveSuperContentTypeWithIcon( content.getType() );
        if ( superContentTypeWithIcon == null || superContentTypeWithIcon.getIcon() == null )
        {
            return null;
        }
        final Icon icon = superContentTypeWithIcon.getIcon();

        final String mimeType = icon.getMimeType();
        final byte[] contentImage = HELPER.readIconImage( icon, size );

        return Response.ok( ByteSource.wrap( contentImage ), mimeType );
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
        return this.contentTypeServiceSupplier.get().getByName( new GetContentTypeParams().contentTypeName( contentTypeName ) );
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
            return imageData.getData().getProperty( "imageWidth" ).getValue().asLong().intValue();
        }

        return 0;
    }

    private Response.ResponseBuilder resolveResponseFromContentSVGAttachment( final Attachment attachment, final ByteSource binary )
    {
        if ( binary == null )
        {
            return null;
        }

        final boolean gzip = attachment.getName() != null && attachment.getName().toLowerCase().endsWith( ".svgz" );
        return imageResponse( binary, attachment.getMimeType(), gzip );
    }

    private Response.ResponseBuilder resolveResponseFromContentImageAttachment( final Media media, final Attachment attachment,
                                                                                final ByteSource binary, final int size,
                                                                                final boolean scaleWidth,
                                                                                final boolean source, final String scale,
                                                                                final String filter,
                                                                                final boolean crop )
    {
        if ( binary == null )
        {
            return null;
        }

        try
        {
            final String mimeType = attachment.getMimeType();

            if ( SKIP_IMAGE_MIME_TYPES.contains( mimeType ) )
            {
                return imageResponse( binary, mimeType, false );
            }

            final Cropping cropping = ( !source && crop ) ? media.getCropping() : null;
            final ImageOrientation imageOrientation =
                source ? null : this.mediaInfoServiceSupplier.get().getImageOrientation( binary, media );
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
                orientation( imageOrientation ).
                filterParam( filter ).
                build();

            final ByteSource contentImage = this.imageServiceSupplier.get().readImage( readImageParams );
            return imageResponse( contentImage, mimeType, false );
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

    private Object serveMedia( final String id, final String identifier, final boolean download )
    {
        final ContentId contentId = ContentId.from( id );

        final Content content = contentServiceSupplier.get().getById( contentId );

        if ( content == null )
        {
            throw new WebApplicationException( String.format( "Content [%s] was not found", contentId ), Response.Status.NOT_FOUND );
        }

        final String decodedIdentifier =
            nullToEmpty( identifier ).isBlank() ? identifier : URLDecoder.decode( identifier, StandardCharsets.UTF_8 );

        final Attachment attachment = resolveAttachment( decodedIdentifier, content );
        if ( attachment == null )
        {
            throw new WebApplicationException( String.format( "Content [%s] has no attachments", contentId ), Response.Status.NOT_FOUND );
        }
        else if ( !download && !MEDIA_ATTACHMENT_TYPES.contains( attachment.getMimeType() ) )
        {
            throw new WebApplicationException( String.format( "Preview for attachment [%s] is not supported", attachment.getName() ) );
        }

        final ByteSource binary = this.contentServiceSupplier.get().getBinary( contentId, attachment.getBinaryReference() );

        return new ResponseMapper( mediaResponse( binary, attachment, download ).build() );
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

    private Response.ResponseBuilder imageResponse( final ByteSource binary, final String mimeType, final boolean gzip )
    {
        final Response.ResponseBuilder r = Response.ok( binary, mimeType );

        r.header( "X-Frame-Options", "SAMEORIGIN" );

        if ( gzip )
        {
            r.encoding( "gzip" );
        }

        r.header( "Content-Security-Policy", "default-src 'none'; base-uri 'none'; form-action 'none'; style-src 'self' 'unsafe-inline'" );

        return r;
    }

    private Response.ResponseBuilder mediaResponse( final ByteSource binary, final Attachment attachment, final Boolean download )
    {
        Response.ResponseBuilder response = Response.ok( binary, attachment.getMimeType() );
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

        response.header( "Content-Security-Policy", "default-src 'none'; base-uri 'none'; form-action 'none'; media-src 'self'" );

        return response;
    }
}
