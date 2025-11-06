package com.enonic.xp.app.contentstudio.rest.resource.content;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Locale;

import org.junit.jupiter.api.Test;

import com.google.common.io.ByteSource;

import jakarta.ws.rs.core.CacheControl;

import com.enonic.xp.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.attachment.Attachment;
import com.enonic.xp.attachment.AttachmentNames;
import com.enonic.xp.attachment.Attachments;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentPublishInfo;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.Media;
import com.enonic.xp.content.Mixin;
import com.enonic.xp.content.Mixins;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.image.ImageService;
import com.enonic.xp.image.ReadImageParams;
import com.enonic.xp.jaxrs.impl.MockRestResponse;
import com.enonic.xp.media.MediaInfo;
import com.enonic.xp.media.MediaInfoService;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.mixin.MixinName;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.web.HttpStatus;

import static com.enonic.xp.media.MediaInfo.IMAGE_INFO_IMAGE_HEIGHT;
import static com.enonic.xp.media.MediaInfo.IMAGE_INFO_IMAGE_WIDTH;
import static com.enonic.xp.media.MediaInfo.IMAGE_INFO_PIXEL_SIZE;
import static com.enonic.xp.media.MediaInfo.MEDIA_INFO_BYTE_SIZE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class ContentIconResourceTest
    extends AdminResourceTestSupport
{
    private ContentService contentService;

    private ImageService imageService;

    @Override
    protected ContentIconResource getResourceInstance()
    {
        ContentIconResource resource = new ContentIconResource();

        contentService = mock( ContentService.class );
        imageService = mock( ImageService.class );

        MediaInfoService mediaInfoService = mock( MediaInfoService.class );

        resource.setContentService( contentService );
        resource.setImageService( imageService );
        resource.setMediaInfoService( mediaInfoService );

        return resource;
    }

    @Test
    public void get_from_thumbnail()
        throws Exception
    {
        Content content = createContent( "content-id", ContentTypeName.from( "my-content-type" ), Attachment.create()
            .mimeType( "image/png" )
            .size( 128 )
            .name( AttachmentNames.THUMBNAIL )
            .build() );

        when( contentService.getById( content.getId() ) ).thenReturn( content );

        ByteSource byteSource = ByteSource.wrap( new byte[]{1, 2, 3} );
        when( imageService.readImage( isA( ReadImageParams.class ) ) ).thenReturn( byteSource );

        MockRestResponse result = request().path( "content/icon/content-id" ).
            queryParam( "contentId", "content-id" ).
            queryParam( "ts", "2" ).get();

        final CacheControl cacheControl = new CacheControl();
        cacheControl.setMaxAge( Integer.MAX_VALUE );

        assertTrue( Arrays.equals( byteSource.read(), result.getData() ) );
        assertEquals( cacheControl.toString(), result.getHeader( "Cache-Control" ) );

        result = request().path( "content/icon/content-id" ).
            queryParam( "contentId", "content-id" ).get();

        assertEquals( null, result.getHeader( "Cache-Control" ) );
    }

    @Test
    public void get_empty_thumbnail_for_a_media()
        throws Exception
    {
        Content content = createContent( "content-id", ContentTypeName.imageMedia(), Attachment.create().
            name( "logo.png" ).
            mimeType( "image/png" ).
            build() );

        when( contentService.getById( content.getId() ) ).thenReturn( content );

        ByteSource byteSource = ByteSource.wrap( new byte[]{1, 2, 3} );
        when( imageService.readImage( isA( ReadImageParams.class ) ) ).thenReturn( byteSource );

        MockRestResponse result = request().path( "content/icon/content-id" ).
            queryParam( "contentId", "content-id" ).
            queryParam( "ts", "2020327" ).get();

        assertTrue( Arrays.equals( byteSource.read(), result.getData() ) );
        assertEquals( "image/png", result.getHeader( "Content-Type" ) );
    }

    @Test
    public void get_empty_thumbnail_for_a_svg()
        throws Exception
    {
        Content content = createContent( "content-id", ContentTypeName.vectorMedia(), Attachment.create().
            name( "logo.svg" ).
            mimeType( "image/svg+xml" ).
            build() );

        when( contentService.getById( content.getId() ) ).thenReturn( content );

        ByteSource byteSource = ByteSource.wrap( new byte[]{1, 2, 3} );
        when( contentService.getBinary( content.getId(), content.getAttachments().get( 0 ).getBinaryReference() ) )
            .thenReturn( byteSource );

        MockRestResponse result = request().path( "content/icon/content-id" ).
            queryParam( "contentId", "content-id" ).
            queryParam( "ts", "2020327" ).get();

        assertTrue( Arrays.equals( byteSource.read(), result.getData() ) );
        assertEquals( "image/svg+xml", result.getHeader( "Content-Type" ) );
    }

    @Test
    public void get_empty_thumbnail_for_not_a_media()
        throws Exception
    {
        Content content = this.createContent( "content-id" );

        when( contentService.getById( content.getId() ) ).thenReturn( content );

        MockRestResponse result = request().path( "content/icon/content-id" ).
            queryParam( "contentId", "content-id" ).
            queryParam( "ts", "2020327" ).get();

        assertEquals( HttpStatus.NOT_FOUND.value(), result.getStatus() );
    }

    @Test
    public void get_content_not_found()
        throws Exception
    {
        MockRestResponse result = request().path( "content/icon/content-id" ).
            queryParam( "contentId", "content-id" ).
            queryParam( "ts", "2020327" ).get();

        assertEquals( HttpStatus.NOT_FOUND.value(), result.getStatus() );

    }

    @Test
    public void read_image_error()
        throws Exception
    {
        Content content = createContent( "content-id", ContentTypeName.from( "my-content-type" ), Attachment.create()
            .mimeType( "image/png" )
            .size( 128 )
            .name( AttachmentNames.THUMBNAIL )
            .build() );

        when( contentService.getById( content.getId() ) ).thenReturn( content );

        when( imageService.readImage( isA( ReadImageParams.class ) ) ).thenThrow( new IOException( "io error message" ) );

        final MockRestResponse get = request().path( "content/icon/content-id" ).
            queryParam( "contentId", "content-id" ).
            queryParam( "ts", "2" ).get();

        assertEquals( 500, get.getStatus() );
        assertEquals( "java.io.IOException: io error message", get.getAsString() );
    }

    @Test
    public void get_empty_image_media()
        throws Exception
    {
        Content content = createContent( "content-id", ContentTypeName.imageMedia(), Attachment.create().
            name( "logo.png" ).
            mimeType( "image/png" ).
            build() );
        content = Content.create( content ).attachments( Attachments.create().build() ).build();

        when( contentService.getById( content.getId() ) ).thenReturn( content );

        MockRestResponse result = request().path( "content/icon/content-id" ).
            queryParam( "contentId", "content-id" ).
            queryParam( "ts", "2020327" ).get();

        assertEquals( HttpStatus.NOT_FOUND.value(), result.getStatus() );
    }

    private Content createContent( final String id )
    {
        return this.createContent( id,  ContentTypeName.from( "my-content-type" ), null );
    }

    private Media.Builder createMediaBuilder( final Attachment attachment )
    {
        Media.Builder result = Media.create();

        final PropertyTree data = new PropertyTree();
        data.addString( "media", attachment.getName() );

        final PropertyTree mediaData = new PropertyTree();
        mediaData.setLong( IMAGE_INFO_PIXEL_SIZE, 300L * 200L );
        mediaData.setLong( IMAGE_INFO_IMAGE_HEIGHT, 200L );
        mediaData.setLong( IMAGE_INFO_IMAGE_WIDTH, 300L );
        mediaData.setLong( MEDIA_INFO_BYTE_SIZE, 100000L );

        final Mixin mediaMixin = new Mixin( MediaInfo.IMAGE_INFO_METADATA_NAME, mediaData );

        return result.attachments(Attachments.from(attachment)).
                data(data).
                mixins( Mixins.create().add( mediaMixin).build());
    }

    private Content createContent( final String id, final ContentTypeName contentType,
                                   final Attachment attachment )
    {
        final PropertyTree metadata = new PropertyTree();
        metadata.setLong( "myProperty", 1L );

        Content.Builder builder = contentType.isMedia() || contentType.isDescendantOfMedia()
            ? createMediaBuilder( attachment )
            : Content.create().attachments( attachment == null ? Attachments.empty() : Attachments.from( attachment ) );

        return builder.
            id( ContentId.from( id ) ).
            parentPath( ContentPath.ROOT ).
            name( "content-name" ).
            valid( true ).
            createdTime( Instant.now() ).
            creator( PrincipalKey.from( "user:system:admin" ) ).
            owner( PrincipalKey.from( "user:myStore:me" ) ).
            language( Locale.ENGLISH ).
            displayName( "My Content" ).
            modifiedTime( Instant.now() ).
            modifier( PrincipalKey.from( "user:system:admin" ) ).
            type( contentType ).
            mixins( Mixins.create().add( new Mixin( MixinName.from( "myApplication:myField" ), metadata ) ).build() ).
            publishInfo( ContentPublishInfo.create().
                from( Instant.parse( "2016-11-02T10:36:00Z" ) ).
                to( Instant.parse( "2016-11-22T10:36:00Z" ) ).
                first( Instant.parse( "2016-11-02T10:36:00Z" ) ).
                build() ).
            build();
    }

}
