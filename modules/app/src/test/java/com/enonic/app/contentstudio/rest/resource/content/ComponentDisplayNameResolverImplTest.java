package com.enonic.app.contentstudio.rest.resource.content;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.region.FragmentComponent;
import com.enonic.xp.region.ImageComponent;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ComponentDisplayNameResolverImplTest
{
    private ComponentDisplayNameResolverImpl componentNameResolver;

    private ContentService contentService;

    @BeforeEach
    public void init()
    {
        componentNameResolver = new ComponentDisplayNameResolverImpl();
        contentService = Mockito.mock( ContentService.class );
        componentNameResolver.setContentService( contentService );
    }

    @Test
    public void testResolveEmptyImageComponent()
        throws Exception
    {
        final ImageComponent imageComponent = ImageComponent.create().build();

        final String result = componentNameResolver.resolve( imageComponent );

        assertEquals( "Image", result );
    }

    @Test
    public void testResolveImageComponent()
        throws Exception
    {
        final Content imageContent = createContent();
        final ImageComponent imageComponent = ImageComponent.create().image( ContentId.from( "id" ) ).build();

        Mockito.when( contentService.getById( imageComponent.getImage() ) ).thenReturn( imageContent );

        final String result = componentNameResolver.resolve( imageComponent );

        assertEquals( imageContent.getDisplayName(), result );
    }

    @Test
    public void testResolveMissingImageComponent()
        throws Exception
    {
        final ContentId imageComponentId = ContentId.from( "imageCompId" );
        final ImageComponent imageComponent = ImageComponent.create().image( imageComponentId ).build();

        Mockito.when( contentService.getById( imageComponent.getImage() ) )
            .thenThrow( ContentNotFoundException.create().contentId( imageComponentId ).build() );

        final String result = componentNameResolver.resolve( imageComponent );

        assertEquals( "Image", result );
    }

    @Test
    public void testResolveEmptyFragmentComponent()
        throws Exception
    {
        final FragmentComponent fragmentComponent = FragmentComponent.create().build();

        final String result = componentNameResolver.resolve( fragmentComponent );

        assertEquals( "Fragment", result );
    }

    @Test
    public void testResolveFragmentComponent()
        throws Exception
    {
        final Content fragmentContent = createContent();
        final FragmentComponent fragmentComponent = FragmentComponent.create().fragment( ContentId.from( "id" ) ).build();

        Mockito.when( contentService.getById( fragmentComponent.getFragment() ) ).thenReturn( fragmentContent );

        final String result = componentNameResolver.resolve( fragmentComponent );

        assertEquals( fragmentContent.getDisplayName(), result );
    }

    @Test
    public void testResolveMissingFragmentComponent()
        throws Exception
    {
        final ContentId fragmentComponentId = ContentId.from( "fragmentCompId" );
        final FragmentComponent fragmentComponent = FragmentComponent.create().fragment( fragmentComponentId ).build();

        Mockito.when( contentService.getById( fragmentComponent.getFragment() ) )
            .thenThrow( ContentNotFoundException.create().contentId( fragmentComponentId ).build() );

        final String result = componentNameResolver.resolve( fragmentComponent );

        assertEquals( "Fragment", result );
    }

    private Content createContent()
    {
        final Content.Builder builder = Content.create();

        builder.id( ContentId.from( "123456" ) );
        builder.name( "someName" );
        builder.parentPath( ContentPath.ROOT );
        builder.displayName( "displayName" );

        return builder.build();
    }

}
