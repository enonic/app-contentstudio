package com.enonic.app.contentstudio.rest.resource.content;

import java.util.List;
import java.util.Locale;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.region.FragmentComponent;
import com.enonic.xp.region.ImageComponent;
import com.enonic.xp.region.PartComponent;
import com.enonic.xp.region.PartDescriptor;
import com.enonic.xp.region.PartDescriptorService;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ComponentDisplayNameResolverImplTest
{
    private ComponentDisplayNameResolverImpl componentNameResolver;

    private ContentService contentService;

    private PartDescriptorService partDescriptorService;

    private LocaleService localeService;

    @BeforeEach
    public void init()
    {
        componentNameResolver = new ComponentDisplayNameResolverImpl();
        contentService = Mockito.mock( ContentService.class );
        componentNameResolver.setContentService( contentService );
        partDescriptorService = Mockito.mock( PartDescriptorService.class );
        componentNameResolver.setPartDescriptorService( partDescriptorService );
        localeService = Mockito.mock( LocaleService.class );
        componentNameResolver.setLocaleService( localeService );
    }

    @Test
    public void testResolvePartComponentLocalized()
    {
        final PartComponent partComponent = mockPart( "part.title" );
        final MessageBundle bundle = Mockito.mock( MessageBundle.class );
        final List<Locale> locales = List.of( Locale.forLanguageTag( "no" ) );

        Mockito.when( localeService.getSupportedLocale( locales, partComponent.getDescriptor().getApplicationKey() ) )
            .thenReturn( locales.get( 0 ) );
        Mockito.when( localeService.getBundle( partComponent.getDescriptor().getApplicationKey(), locales.get( 0 ) ) )
            .thenReturn( bundle );
        Mockito.when( bundle.localize( "part.title" ) ).thenReturn( "Min part" );

        assertEquals( "Min part", componentNameResolver.resolve( partComponent, locales ) );
    }

    @Test
    public void testResolvePartComponentWithInvalidMessagePattern()
    {
        final PartComponent partComponent = mockPart( "part.title" );
        final MessageBundle bundle = Mockito.mock( MessageBundle.class );
        final List<Locale> locales = List.of( Locale.forLanguageTag( "no" ) );

        Mockito.when( localeService.getSupportedLocale( locales, partComponent.getDescriptor().getApplicationKey() ) )
            .thenReturn( locales.get( 0 ) );
        Mockito.when( localeService.getBundle( partComponent.getDescriptor().getApplicationKey(), locales.get( 0 ) ) )
            .thenReturn( bundle );
        Mockito.when( bundle.localize( "part.title" ) ).thenThrow( new IllegalArgumentException( "can't parse argument number: label" ) );
        Mockito.when( bundle.getMessage( "part.title" ) ).thenReturn( "Min {label}" );

        assertEquals( "Min {label}", componentNameResolver.resolve( partComponent, locales ) );
    }

    @Test
    public void testResolvePartComponentWithoutTranslation()
    {
        final PartComponent partComponent = mockPart( "part.title" );
        final List<Locale> locales = List.of( Locale.forLanguageTag( "no" ) );

        assertEquals( "My part", componentNameResolver.resolve( partComponent, locales ) );
        assertEquals( "My part", componentNameResolver.resolve( partComponent ) );
    }

    @Test
    public void testResolvePartComponentWithoutI18nKey()
    {
        final PartComponent partComponent = mockPart( null );

        assertEquals( "My part", componentNameResolver.resolve( partComponent, List.of( Locale.forLanguageTag( "no" ) ) ) );
        Mockito.verifyNoInteractions( localeService );
    }

    private PartComponent mockPart( final String titleI18nKey )
    {
        final DescriptorKey key = DescriptorKey.from( "myapp:mypart" );
        final PartDescriptor descriptor = Mockito.mock( PartDescriptor.class );

        Mockito.when( descriptor.getTitle() ).thenReturn( "My part" );
        Mockito.when( descriptor.getTitleI18nKey() ).thenReturn( titleI18nKey );
        Mockito.when( descriptor.getApplicationKey() ).thenReturn( key.getApplicationKey() );
        Mockito.when( partDescriptorService.getByKey( key ) ).thenReturn( descriptor );

        return PartComponent.create().descriptor( key ).build();
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
        final ContentId imageComponentId = ContentId.from( "image-comp-id" );
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
        final ContentId fragmentComponentId = ContentId.from( "fragment-comp-id" );
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
