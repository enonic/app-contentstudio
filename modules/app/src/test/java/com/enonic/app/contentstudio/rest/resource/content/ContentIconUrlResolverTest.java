package com.enonic.app.contentstudio.rest.resource.content;

import java.time.Instant;
import java.util.function.Supplier;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.HttpHeaders;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.enonic.xp.attachment.Attachment;
import com.enonic.xp.attachment.AttachmentNames;
import com.enonic.xp.attachment.Attachments;
import com.enonic.xp.branch.Branch;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.Media;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessorSupport;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.portal.url.ImageUrlGeneratorParams;
import com.enonic.xp.portal.url.PortalUrlGeneratorService;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ContentIconUrlResolverTest
{
    private static final String PROJECT_NAME = "test-project";

    private static final RepositoryId REPO_ID = RepositoryId.from( "com.enonic.cms." + PROJECT_NAME );

    private static final Branch BRANCH = Branch.from( "draft" );

    private static final String GENERATED_IMAGE_URL = "/api/media:image/test-project:draft/abc:hash/square-128/photo.jpg";

    private ContentTypeService contentTypeService;

    private PortalUrlGeneratorService portalUrlGeneratorService;

    private HttpServletRequest request;

    private ContentIconUrlResolver resolver;

    @BeforeEach
    void setUp()
    {
        contentTypeService = mock( ContentTypeService.class );
        portalUrlGeneratorService = mock( PortalUrlGeneratorService.class );
        request = mock( HttpServletRequest.class );
        when( request.getHeader( HttpHeaders.HOST ) ).thenReturn( "localhost" );
        when( request.getRequestURL() ).thenReturn( new StringBuffer( "http://localhost/api/admin/contentstudio" ) );
        when( request.getServerName() ).thenReturn( "localhost" );

        when( portalUrlGeneratorService.imageUrl( any( ImageUrlGeneratorParams.class ) ) ).thenReturn( GENERATED_IMAGE_URL );

        resolver = new ContentIconUrlResolver( contentTypeService, portalUrlGeneratorService, request );
    }

    @Test
    void image_media_uses_media_image_api()
    {
        runInContext( () -> {
            final Media image = newImageMedia( true );

            final String url = resolver.resolve( image );

            assertThat( url ).contains( GENERATED_IMAGE_URL );

            final ArgumentCaptor<ImageUrlGeneratorParams> captor = ArgumentCaptor.forClass( ImageUrlGeneratorParams.class );
            verify( portalUrlGeneratorService ).imageUrl( captor.capture() );

            final ImageUrlGeneratorParams params = captor.getValue();
            assertThat( params.getMedia().get() ).isSameAs( image );
            assertThat( params.getProjectName().get() ).isEqualTo( ProjectName.from( PROJECT_NAME ) );
            assertThat( params.getBranch().get() ).isEqualTo( BRANCH );
            assertThat( params.getScale() ).isEqualTo( "square(128)" );
            // No cache-buster query param: the media:image URL is content-hashed already.
            assertThat( params.getQueryParams() ).isEmpty();
        } );
    }

    @Test
    void content_with_thumbnail_attachment_uses_legacy_icon_endpoint()
    {
        runInContext( () -> {
            final Content content = newContentWithThumbnail();

            final String url = resolver.resolve( content );

            assertThat( url ).contains( "/content/icon/" + content.getId().toString() );
            verify( portalUrlGeneratorService, never() ).imageUrl( any() );
        } );
    }

    @Test
    void image_media_without_attachment_falls_back_to_content_type_icon()
    {
        runInContext( () -> {
            final Media image = newImageMedia( false );

            resolver.resolve( image );

            // No media:image URL generated because there is no media attachment.
            verify( portalUrlGeneratorService, never() ).imageUrl( any() );
        } );
    }

    private static <T> T runInContext( final Supplier<T> action )
    {
        final Context ctx = ContextBuilder.create().repositoryId( REPO_ID ).branch( BRANCH ).build();
        return ctx.callWith( action::get );
    }

    private static void runInContext( final Runnable action )
    {
        runInContext( () -> {
            action.run();
            return null;
        } );
    }

    private static PropertyTree buildImageData( final boolean withAttachment )
    {
        final PropertyTree data = new PropertyTree();
        if ( withAttachment )
        {
            data.addSet( "media" ).setString( "attachment", "photo.jpg" );
        }
        return data;
    }

    private static Media newImageMedia( final boolean withAttachment )
    {
        final Attachments attachments = withAttachment
            ? Attachments.from( Attachment.create()
                                    .name( "photo.jpg" )
                                    .mimeType( "image/jpeg" )
                                    .label( "source" )
                                    .build() )
            : Attachments.empty();

        return Media.create()
            .id( ContentId.from( "abc" ) )
            .path( ContentPath.from( "/photo.jpg" ) )
            .name( "photo.jpg" )
            .displayName( "photo" )
            .type( ContentTypeName.imageMedia() )
            .data( buildImageData( withAttachment ) )
            .attachments( attachments )
            .modifiedTime( Instant.parse( "2024-01-01T00:00:00Z" ) )
            .build();
    }

    private static Content newContentWithThumbnail()
    {
        final Attachment thumbnail = Attachment.create()
            .name( AttachmentNames.THUMBNAIL )
            .mimeType( "image/png" )
            .label( "thumbnail" )
            .build();

        return Content.create()
            .id( ContentId.from( "xyz" ) )
            .path( ContentPath.from( "/doc" ) )
            .name( "doc" )
            .displayName( "doc" )
            .type( ContentTypeName.from( "myapp:doc" ) )
            .data( new PropertyTree() )
            .attachments( Attachments.from( thumbnail ) )
            .modifiedTime( Instant.parse( "2024-01-01T00:00:00Z" ) )
            .build();
    }
}
