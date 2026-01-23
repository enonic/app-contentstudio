package com.enonic.app.contentstudio.rest.resource.schema.content;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.stubbing.Answer;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationKeys;
import com.enonic.app.contentstudio.rest.AdminRestConfig;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.core.impl.content.schema.BuiltinContentTypesAccessor;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.descriptor.DescriptorKey;
import com.enonic.xp.form.Form;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.page.PageDescriptor;
import com.enonic.xp.page.PageDescriptorService;
import com.enonic.xp.page.PageDescriptors;
import com.enonic.xp.project.Project;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.project.ProjectService;
import com.enonic.xp.region.LayoutDescriptor;
import com.enonic.xp.region.LayoutDescriptorService;
import com.enonic.xp.region.LayoutDescriptors;
import com.enonic.xp.region.PartDescriptor;
import com.enonic.xp.region.PartDescriptorService;
import com.enonic.xp.region.PartDescriptors;
import com.enonic.xp.region.RegionDescriptors;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.ContentTypes;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteConfigs;
import com.enonic.xp.site.SiteConfigsDataSerializer;
import com.enonic.xp.util.GenericValue;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FilterByContentResolverTest
{
    @Mock
    ContentTypeService contentTypeService;

    @Mock
    ContentService contentService;

    @Mock
    LayoutDescriptorService layoutDescriptorService;

    @Mock
    PartDescriptorService partDescriptorService;

    @Mock
    PageDescriptorService pageDescriptorService;

    @Mock
    ProjectService projectService;

    FilterByContentResolver filterByContentResolver;

    Set<ContentType> knownContentTypes;

    @Mock
    AdminRestConfig config;

    @BeforeEach
    void setUp()
    {
        filterByContentResolver = new FilterByContentResolver();
        filterByContentResolver.setContentService( contentService );
        filterByContentResolver.setContentTypeService( contentTypeService );
        filterByContentResolver.setLayoutDescriptorService( layoutDescriptorService );
        filterByContentResolver.setPageDescriptorService( pageDescriptorService );
        filterByContentResolver.setPartDescriptorService( partDescriptorService );
        filterByContentResolver.setProjectService( projectService );

        when( config.contentTypePatternMode() ).thenReturn( "MATCH" );
        filterByContentResolver.activate( config );

        knownContentTypes = new HashSet<>( BuiltinContentTypesAccessor.getAll().stream().toList() );

        lenient().when( contentTypeService.getByName(
                argThat( argument -> knownContentTypes.stream().anyMatch( ct -> ct.getName().equals( argument.getContentTypeName() ) ) ) ) )
            .thenAnswer( (Answer<ContentType>) invocation -> knownContentTypes.stream()
                .filter( ct -> ct.getName().equals( invocation.<GetContentTypeParams>getArgument( 0 ).getContentTypeName() ) )
                .findAny()
                .orElseThrow() );
    }

    @Test
    void contentTypes_default_all_allowed()
    {
        final ContentType contentType = ContentType.create()
            .superType( ContentTypeName.structured() )
            .allowChildContent( true )
            .displayName( "My type" )
            .name( "application:test-type" )
            .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
            .build();

        knownContentTypes.add( contentType );

        when( contentService.getById( ContentId.from( "test" ) ) ).thenReturn(
            someContent( ContentTypeName.from( "application:test-type" ) ) );
        when( contentService.getNearestSite( ContentId.from( "test" ) ) ).thenReturn( someSite() );

        when( contentTypeService.getByApplication( ApplicationKey.from( "application" ) ) ).thenReturn( ContentTypes.from( contentType ) );

        final Stream<ContentType> contentTypes = filterByContentResolver.contentTypes( ContentId.from( "test" ), Set.of() );
        assertThat( contentTypes.map( ContentType::getName ) ).contains(ContentTypeName.folder(),
                                                                        ContentTypeName.site(),
                                                                        ContentTypeName.shortcut(),
                                                                        ContentTypeName.imageMedia(),
                                                                        ContentTypeName.from( "application:test-type" )
                                                                        );
    }

    @Test
    void contentTypes_multiple_filters()
    {
        final ContentType contentType = ContentType.create()
            .superType( ContentTypeName.structured() )
            .allowChildContent( true )
            .displayName( "My type" )
            .name( "application:test-type" )
            .allowChildContentType( List.of( "${app}:*", "base:folder" ) )
            .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
            .build();

        knownContentTypes.add( contentType );

        when( contentService.getById( ContentId.from( "test" ) ) ).thenReturn(
            someContent( ContentTypeName.from( "application:test-type" ) ) );
        when( contentService.getNearestSite( ContentId.from( "test" ) ) ).thenReturn( someSite() );

        when( contentTypeService.getByApplication( ApplicationKey.from( "application" ) ) ).thenReturn( ContentTypes.from( contentType ) );

        final Stream<ContentType> contentTypes = filterByContentResolver.contentTypes( ContentId.from( "test" ), Set.of() );
        assertThat( contentTypes.map( ContentType::getName ) ).containsExactly( ContentTypeName.folder(),
                                                                                ContentTypeName.from( "application:test-type" ) );
    }

    @Test
    void contentTypes_disallowed_child_content()
    {
        final ContentType noChildContent =
            ContentType.create()
                .superType( ContentTypeName.structured() )
                .allowChildContent( false ) // this makes result empty
                .displayName( "My type" )
                .name( "application:test-type" )
                .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
                .build();

        knownContentTypes.add( noChildContent );

        when( contentService.getById( ContentId.from( "test" ) ) ).thenReturn(
            someContent( ContentTypeName.from( "application:test-type" ) ) );

        final Stream<ContentType> contentTypes = filterByContentResolver.contentTypes( ContentId.from( "test" ), Set.of() );
        assertThat( contentTypes ).isEmpty();
    }

    @Test
    void contentTypes_root()
    {
        final Stream<ContentType> contentTypes = filterByContentResolver.contentTypes( null, Set.of() );

        verify( contentService, never() ).getById( any() );
        assertThat( contentTypes.map( ContentType::getName ) ).contains( ContentTypeName.folder(),
                                                                        ContentTypeName.site(),
                                                                        ContentTypeName.imageMedia(),
                                                                        ContentTypeName.shortcut() );
    }

    @Test
    void contentTypes_template_folder()
    {
        when( contentService.getById( ContentId.from( "test" ) ) ).thenReturn( someContent( ContentTypeName.templateFolder() ) );

        final Stream<ContentType> contentTypes = filterByContentResolver.contentTypes( ContentId.from( "test" ), Set.of() );

        assertThat( contentTypes.map( ContentType::getName ) ).containsExactly( ContentTypeName.pageTemplate() );
    }

    @Test
    void contentTypes_no_abstract()
    {
        final ContentType content = ContentType.create()
            .superType( ContentTypeName.structured() )
            .allowChildContent( true )
            .displayName( "My type" )
            .name( "application:test-type" )
            .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
            .build();

        final ContentType abstractContent = ContentType.create()
            .superType( ContentTypeName.structured() )
            .setAbstract()
            .allowChildContent( true )
            .displayName( "My type" )
            .name( "application:test-type-abstract" )
            .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
            .build();

        knownContentTypes.add( content );
        knownContentTypes.add( abstractContent );

        when( contentService.getById( ContentId.from( "test" ) ) ).thenReturn(
            someContent( ContentTypeName.from( "application:test-type" ) ) );
        when( contentService.getNearestSite( ContentId.from( "test" ) ) ).thenReturn( someSite() );

        when( contentTypeService.getByApplication( ApplicationKey.from( "application" ) ) ).thenReturn(
            ContentTypes.from( content, abstractContent ) );

        final Stream<ContentType> contentTypes = filterByContentResolver.contentTypes( ContentId.from( "test" ), Set.of() );
        assertThat( contentTypes
                .map( ContentType::getName ) )
                .contains( ContentTypeName.folder(),
                        ContentTypeName.site(),
                        ContentTypeName.shortcut(),
                        ContentTypeName.imageMedia(),
                        ContentTypeName.from( "application:test-type")
                );
    }

    @Test
    void contentTypes_no_disabled()
    {
        final ContentType content = ContentType.create()
            .superType( ContentTypeName.structured() )
            .allowChildContent( true )
            .displayName( "My type" )
            .name( "application:test-type" )
            .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
            .build();

        final ContentType disabledContent = ContentType.create()
            .superType( ContentTypeName.structured() )
            .schemaConfig( GenericValue.newObject().put( "allowNewContent", false ).build() )
            .allowChildContent( true )
            .displayName( "My type" )
            .name( "application:test-type-disabled" )
            .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
            .build();

        knownContentTypes.add( content );
        knownContentTypes.add( disabledContent );

        when( contentService.getById( ContentId.from( "test" ) ) ).thenReturn(
            someContent( ContentTypeName.from( "application:test-type" ) ) );
        when( contentService.getNearestSite( ContentId.from( "test" ) ) ).thenReturn( someSite() );

        when( contentTypeService.getByApplication( ApplicationKey.from( "application" ) ) ).thenReturn(
            ContentTypes.from( content, disabledContent ) );

        final Stream<ContentType> contentTypes = filterByContentResolver.contentTypes( ContentId.from( "test" ), Set.of() );
        assertThat( contentTypes
                .map( ContentType::getName ) )
                .contains( ContentTypeName.folder(),
                        ContentTypeName.site(),
                        ContentTypeName.shortcut(),
                        ContentTypeName.imageMedia(),
                        ContentTypeName.from( "application:test-type")
                );
    }

    @Test
    void contentTypes_from_project()
    {
        final ContentType content1 = ContentType.create()
            .superType( ContentTypeName.structured() )
            .allowChildContent( true )
            .displayName( "My type" )
            .name( "application1:test-type" )
            .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
            .build();

        final ContentType content2 = ContentType.create()
            .superType( ContentTypeName.structured() )
            .allowChildContent( true )
            .displayName( "My type" )
            .name( "application2:test-type" )
            .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
            .build();

        knownContentTypes.add( content1 );
        knownContentTypes.add( content2 );

        when( contentService.getById( ContentId.from( "test" ) ) ).thenReturn(
            someContent( ContentTypeName.from( "application1:test-type" ) ) );

        when( contentTypeService.getByApplication( ApplicationKey.from( "application2" ) ) ).thenReturn( ContentTypes.from( content2 ) );

        final Project.Builder builder = Project.create();
        builder.name( ProjectName.from( "default" ) );
        builder.displayName( "Default" );
        builder.addSiteConfig(
            SiteConfig.create().application( ApplicationKey.from( "application2" ) ).config( new PropertyTree() ).build() );

        final Project project = builder.build();

        when( projectService.get( ProjectName.from( "default" ) ) ).thenReturn( project );

        final Stream<ContentType> contentTypes =
            ContextBuilder.from( ContextAccessor.current() ).repositoryId( project.getName().getRepoId() ).build().callWith(
                () -> filterByContentResolver.contentTypes( ContentId.from( "test" ), Set.of() ) );

        assertThat( contentTypes
                    .map( ContentType::getName ) )
                    .contains( ContentTypeName.folder(),
                               ContentTypeName.site(),
                               ContentTypeName.shortcut(),
                               ContentTypeName.imageMedia(),
                               ContentTypeName.from( "application2:test-type")
                             );
    }

    @Test
    void contentTypes_allowedContentTypes_filter()
    {
        final ContentType contentType = ContentType.create()
            .superType( ContentTypeName.structured() )
            .allowChildContent( true )
            .displayName( "My type" )
            .name( "application:test-type" )
            .icon( Icon.from( new byte[]{123}, "image/gif", Instant.now() ) )
            .build();

        knownContentTypes.add( contentType );

        when( contentService.getById( ContentId.from( "test" ) ) ).thenReturn(
            someContent( ContentTypeName.from( "application:test-type" ) ) );
        when( contentService.getNearestSite( ContentId.from( "test" ) ) ).thenReturn( someSite() );

        when( contentTypeService.getByApplication( ApplicationKey.from( "application" ) ) ).thenReturn( ContentTypes.from( contentType ) );

        Stream<ContentType> contentTypes = filterByContentResolver.contentTypes( ContentId.from( "test" ), Set.of( "test-type" ) );
        assertThat( contentTypes.map( ContentType::getName ) ).containsExactly( ContentTypeName.from( "application:test-type" ) );

        contentTypes = filterByContentResolver.contentTypes( ContentId.from( "test" ), Set.of( "base:folder" ) );
        assertThat( contentTypes.map( ContentType::getName ) ).containsExactly( ContentTypeName.folder() );
    }


    @Test
    void layouts()
    {
        when( contentService.getById( ContentId.from( "test" ) ) ).thenReturn(
            someContent( ContentTypeName.from( "application:test-type" ) ) );
        when( contentService.getNearestSite( ContentId.from( "test" ) ) ).thenReturn( someSite() );

        final LayoutDescriptor disallowedLayout = LayoutDescriptor.create()
            .displayName( "Disallowed layout" )
            .schemaConfig( GenericValue.newObject().put( "allowOnContentType", "some.different.app:*" ).build()  )
            .config( Form.create().build() )
            .regions( RegionDescriptors.create().build() )
            .key( DescriptorKey.from( "module:disallowed-layout" ) )
            .build();

        final LayoutDescriptor allowedByDefaultLayout = LayoutDescriptor.create()
            .displayName( "Allowed By Default layout" )
            .config( Form.create().build() )
            .regions( RegionDescriptors.create().build() )
            .key( DescriptorKey.from( "module:allowed-by-default-layout" ) )
            .build();

        final LayoutDescriptor allowedLayout = LayoutDescriptor.create()
            .displayName( "Allowed" )
            .schemaConfig( GenericValue.newObject().put( "allowOnContentType", "application:test-type" ).build() )
            .config( Form.create().build() )
            .regions( RegionDescriptors.create().build() )
            .key( DescriptorKey.from( "module:allowed-layout" ) )
            .build();

        when( layoutDescriptorService.getByApplications( ApplicationKeys.from( "application" ) ) ).thenReturn(
            LayoutDescriptors.from( disallowedLayout, allowedByDefaultLayout, allowedLayout ) );
        final Stream<LayoutDescriptor> layouts = filterByContentResolver.layouts( ContentId.from( "test" ) );

        assertThat( layouts.map( LayoutDescriptor::getKey ) ).containsExactly( DescriptorKey.from( "module:allowed-by-default-layout" ),
                                                                               DescriptorKey.from( "module:allowed-layout" ) );
    }

    @Test
    void parts()
    {
        when( contentService.getById( ContentId.from( "test" ) ) ).thenReturn(
            someContent( ContentTypeName.from( "application:test-type" ) ) );
        when( contentService.getNearestSite( ContentId.from( "test" ) ) ).thenReturn( someSite() );

        final PartDescriptor disallowedPart = PartDescriptor.create()
            .displayName( "Disallowed" )
            .schemaConfig( GenericValue.newObject().put( "allowOnContentType", "some.different.app:*" ).build()  )
            .config( Form.create().build() )
            .key( DescriptorKey.from( "module:disallowed" ) )
            .build();

        final PartDescriptor allowedByDefaultLayout = PartDescriptor.create()
            .displayName( "Allowed By Default layout" )
            .config( Form.create().build() )
            .key( DescriptorKey.from( "module:allowed-by-default" ) )
            .build();

        final PartDescriptor allowedLayout = PartDescriptor.create()
            .displayName( "Allowed" )
            .schemaConfig( GenericValue.newObject().put( "allowOnContentType", "application:test-type" ).build()  )
            .config( Form.create().build() )
            .key( DescriptorKey.from( "module:allowed" ) )
            .build();

        when( partDescriptorService.getByApplications( ApplicationKeys.from( "application" ) ) ).thenReturn(
            PartDescriptors.from( disallowedPart, allowedByDefaultLayout, allowedLayout ) );
        final Stream<PartDescriptor> parts = filterByContentResolver.parts( ContentId.from( "test" ) );

        assertThat( parts.map( PartDescriptor::getKey ) ).containsExactly( DescriptorKey.from( "module:allowed-by-default" ),
                                                                           DescriptorKey.from( "module:allowed" ) );
    }

    @Test
    void pages()
    {
        when( contentService.getById( ContentId.from( "test" ) ) ).thenReturn(
            someContent( ContentTypeName.from( "application:test-type" ) ) );
        when( contentService.getNearestSite( ContentId.from( "test" ) ) ).thenReturn( someSite() );

        final PageDescriptor disallowedPage = PageDescriptor.create()
            .displayName( "Disallowed" )
            .schemaConfig( GenericValue.newObject().put( "allowOnContentType", "some.different.app:*" ).build() )
            .regions( RegionDescriptors.create().build() )
            .key( DescriptorKey.from( "module:disallowed" ) )
            .build();

        final PageDescriptor allowedByDefaultPage = PageDescriptor.create()
            .displayName( "Allowed By Default" )
            .config( Form.create().build() )
            .regions( RegionDescriptors.create().build() )
            .key( DescriptorKey.from( "module:allowed-by-default" ) )
            .build();

        final PageDescriptor allowedPage = PageDescriptor.create()
            .displayName( "Allowed" )
            .schemaConfig( GenericValue.newObject().put( "allowOnContentType", "application:test-type" ).build() )
            .config( Form.create().build() )
            .regions( RegionDescriptors.create().build() )
            .key( DescriptorKey.from( "module:allowed" ) )
            .build();

        when( pageDescriptorService.getByApplications( ApplicationKeys.from( "application" ) ) ).thenReturn(
            PageDescriptors.from( disallowedPage, allowedByDefaultPage, allowedPage ) );
        final Stream<PageDescriptor> pages = filterByContentResolver.pages( ContentId.from( "test" ) );

        assertThat( pages.map( PageDescriptor::getKey ) ).containsExactly( DescriptorKey.from( "module:allowed-by-default" ),
                                                                           DescriptorKey.from( "module:allowed" ) );
    }

    private Content someContent( ContentTypeName contentTypeName )
    {

        final Content.Builder<?> builder = Content.create();

        builder.id( ContentId.from( "123" ) );
        builder.name( "someName" );
        builder.parentPath( ContentPath.ROOT );
        builder.displayName( "displayName" );
        builder.type( contentTypeName );
        return builder.build();
    }

    private Site someSite()
    {
        final PropertyTree dataSet = new PropertyTree();
        SiteConfigsDataSerializer.toData( SiteConfigs.create()
                                              .add( SiteConfig.create()
                                                        .config( new PropertyTree() )
                                                        .application( ApplicationKey.from( "application" ) )
                                                        .build() )
                                              .build(), dataSet.getRoot() );

        final Site.Builder builder = Site.create();

        builder.id( ContentId.from( "456" ) );
        builder.name( "someName" );
        builder.parentPath( ContentPath.ROOT );
        builder.displayName( "displayName" );
        builder.data( dataSet );

        return builder.build();
    }
}
