package com.enonic.app.contentstudio.rest.resource.schema.mixins;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.Locale;

import org.jboss.resteasy.core.ResteasyContext;
import org.junit.jupiter.api.Test;
import org.mockito.AdditionalAnswers;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentName;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.form.Form;
import com.enonic.xp.form.Input;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.inputtype.InputTypeName;
import com.enonic.xp.project.Project;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.project.ProjectService;
import com.enonic.xp.schema.content.CmsFormFragmentService;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.mixin.MixinDescriptor;
import com.enonic.xp.schema.mixin.MixinDescriptors;
import com.enonic.xp.schema.mixin.MixinName;
import com.enonic.xp.schema.mixin.MixinNames;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.site.CmsDescriptor;
import com.enonic.xp.site.CmsService;
import com.enonic.xp.site.MixinMapping;
import com.enonic.xp.site.MixinMappingService;
import com.enonic.xp.site.MixinMappings;
import com.enonic.xp.site.MixinOption;
import com.enonic.xp.site.MixinOptions;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteConfigService;
import com.enonic.xp.site.SiteConfigs;
import com.enonic.xp.site.SiteConfigsDataSerializer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class MixinsContextResourceTest
    extends AdminResourceTestSupport
{
    private MixinService mixinService;

    private ContentService contentService;

    private CmsService cmsService;

    private ProjectService projectService;

    private MixinMappingService mixinMappingService;

    private SiteConfigService siteConfigService;

    @Override
    protected MixinsContextResource getResourceInstance()
    {
        CmsFormFragmentService cmsFormFragmentService = mock( CmsFormFragmentService.class );
        LocaleService localeService = mock( LocaleService.class );
        mixinService = mock( MixinService.class );
        contentService = mock( ContentService.class );
        cmsService = mock( CmsService.class );
        projectService = mock( ProjectService.class );
        mixinMappingService = mock( MixinMappingService.class );
        siteConfigService = mock( SiteConfigService.class );

        final MixinsContextResource resource = new MixinsContextResource();
        resource.setCmsFormFragmentService( cmsFormFragmentService );
        resource.setLocaleService( localeService );
        resource.setContentService( contentService );
        resource.setMixinMappingService( mixinMappingService );
        resource.setSiteConfigService( siteConfigService );

        resource.activate();

        when( cmsFormFragmentService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        final HttpServletRequest mockRequest = mock( HttpServletRequest.class );
        when( mockRequest.getServerName() ).thenReturn( "localhost" );
        when( mockRequest.getScheme() ).thenReturn( "http" );
        when( mockRequest.getServerPort() ).thenReturn( 80 );
        when( mockRequest.getLocales() ).thenReturn( Collections.enumeration( Collections.singleton( Locale.US ) ) );
        ResteasyContext.getContextDataMap().put( HttpServletRequest.class, mockRequest );

        return resource;
    }

    @Test
    public void getContentMixinsMultipleConfig()
        throws Exception
    {
        final MixinDescriptor mixinDescriptor = generateMixinDescriptor1();
        final ContentType contentType = createContentType();
        final Content content = mockContent( contentType.getName() );
        final Site site = createSite( contentType.getName().getApplicationKey() );

        final CmsDescriptor cmsDescriptor = CmsDescriptor.create()
            .applicationKey( ApplicationKey.from( "myapplication" ) )
            .mixinMappings( MixinMappings.from(
                MixinMapping.create().mixinName( mixinDescriptor.getName() ).allowContentTypes( "app:testContentType" ).optional(
                    true ).build(),
                MixinMapping.create().mixinName( mixinDescriptor.getName() ).allowContentTypes( "app:testContentType" ).optional(
                    false ).build() ) )
            .build();

        when( cmsService.getDescriptor( contentType.getName().getApplicationKey() ) ).thenReturn( cmsDescriptor );

        when( contentService.getById( ContentId.from( "contentId" ) ) ).thenReturn( content );
        when( contentService.getNearestSite( ContentId.from( "contentId" ) ) ).thenReturn( site );

        when( mixinService.getByNames( MixinNames.from( mixinDescriptor.getName() ) ) ).thenReturn(
            MixinDescriptors.from( mixinDescriptor ) );
        when( mixinService.getByNames( MixinNames.empty() ) ).thenReturn( MixinDescriptors.empty() );
        when( mixinService.getByName( mixinDescriptor.getName() ) ).thenReturn( mixinDescriptor );

        when( siteConfigService.getSiteConfigs( any() ) ).thenReturn( SiteConfigs.from(
            SiteConfig.create().application( ApplicationKey.from( "myapplication" ) ).config( new PropertyTree() ).build() ) );

        when( mixinMappingService.getMixinMappingOptions( eq( contentType.getName() ), any() ) ).thenReturn(
            MixinOptions.create().add( new MixinOption( mixinDescriptor, true ) ).build() );

        String result = request().path( "cms/default/content/schema/mixins/getContentMixins" ).
            queryParam( "contentId", "contentId" ).get().getAsString();

        assertJson( "get_content_mixins_duplicated_config.json", result );
    }

    @Test
    public void getContentMixinsFromNearestSite()
        throws Exception
    {
        final MixinDescriptor mixinDescriptor1 = generateMixinDescriptor1();
        final MixinDescriptor mixinDescriptor2 = generateMixinDescriptor2();
        final ContentType contentType = createContentType();
        final Content content = mockContent( contentType.getName() );
        final Site site = createSite( contentType.getName().getApplicationKey() );

        final CmsDescriptor siteDescriptor = CmsDescriptor.create()
            .applicationKey( ApplicationKey.from( "myapplication" ) )
            .mixinMappings( MixinMappings.from(
                MixinMapping.create().mixinName( mixinDescriptor1.getName() ).allowContentTypes( "app:testContentType|^app:*" ).build(),
                MixinMapping.create().mixinName( mixinDescriptor2.getName() ).allowContentTypes( "app:testContentType|^app:*" ).build() ) )
            .build();

        when( cmsService.getDescriptor( contentType.getName().getApplicationKey() ) ).thenReturn( siteDescriptor );
        when( contentService.getById( ContentId.from( "contentId" ) ) ).thenReturn( content );
        when( contentService.getNearestSite( ContentId.from( "contentId" ) ) ).thenReturn( site );
        when( mixinService.getByName( mixinDescriptor1.getName() ) ).thenReturn( mixinDescriptor1 );
        when( mixinService.getByName( mixinDescriptor2.getName() ) ).thenReturn( mixinDescriptor2 );

        when( siteConfigService.getSiteConfigs( any() ) ).thenReturn( SiteConfigs.from(
            SiteConfig.create().application( ApplicationKey.from( "myapplication" ) ).config( new PropertyTree() ).build() ) );

        when( mixinMappingService.getMixinMappingOptions( eq( contentType.getName() ), any() ) ).thenReturn(
            MixinOptions.create().add( new MixinOption( mixinDescriptor1, false ) ).add(
                new MixinOption( mixinDescriptor2, false ) ).build() );

        String result =
            request().path( "cms/default/content/schema/mixins/getContentMixins" ).
                queryParam( "contentId", "contentId" ).get().getAsString();

        assertJson( "get_content_mixins.json", result );
    }

    @Test
    public void getContentMixinsNoSiteDescriptorNoProjectDescriptor()
        throws Exception
    {
        final MixinDescriptor mixinDescriptor1 = generateMixinDescriptor1();
        final ContentType contentType = createContentType();
        final Content content = mockContent( contentType.getName() );
        final Site site = createSite( contentType.getName().getApplicationKey() );

        when( cmsService.getDescriptor( contentType.getName().getApplicationKey() ) ).thenReturn( null );
        when( contentService.getById( ContentId.from( "contentId" ) ) ).thenReturn( content );
        when( contentService.getNearestSite( ContentId.from( "contentId" ) ) ).thenReturn( site );
        when( mixinService.getByName( mixinDescriptor1.getName() ) ).thenReturn( mixinDescriptor1 );

        when( siteConfigService.getSiteConfigs( any() ) ).thenReturn( SiteConfigs.from(
            SiteConfig.create().application( ApplicationKey.from( "myapplication" ) ).config( new PropertyTree() ).build() ) );

        when( mixinMappingService.getMixinMappingOptions( eq( contentType.getName() ), any() ) ).thenReturn( MixinOptions.empty() );

        String result =
            request().path( "cms/default/content/schema/mixins/getContentMixins" ).
                queryParam( "contentId", "contentId" ).get().getAsString();

        assertJson( "get_content_mixins_no_site_descriptor.json", result );
    }

    @Test
    public void getProjectMixin()
        throws Exception
    {
        final MixinDescriptor descriptor1 = generateMixinDescriptor1();
        final MixinDescriptor descriptor2 = generateMixinDescriptor2();

        final ContentType contentType = createContentType();
        final Content content = mockContent( contentType.getName() );

        final CmsDescriptor cmsDescriptor = CmsDescriptor.create()
            .applicationKey( ApplicationKey.from( "myapplication" ) )
            .mixinMappings( MixinMappings.from(
                MixinMapping.create().mixinName( descriptor2.getName() ).allowContentTypes( "app:testContentType|^app:*" ).build() ) )
            .build();

        final Project project = Project.create()
            .name( ProjectName.from( "myproject") )
            .displayName( "project" )
            .addSiteConfig( SiteConfig.create().
                application( ApplicationKey.from( "myapplication" ) ).config( new PropertyTree() ).build() )
            .build();

        when( projectService.get( isA( ProjectName.class ) ) ).thenReturn( project );

        when( cmsService.getDescriptor( ApplicationKey.from( "myapplication" ) ) ).thenReturn( cmsDescriptor );

        when( contentService.getById( ContentId.from( "contentId" ) ) ).thenReturn( content );

        when( mixinService.getByNames( MixinNames.from( descriptor1.getName() ) ) ).thenReturn( MixinDescriptors.from( descriptor1 ) );
        when( mixinService.getByNames( MixinNames.from( descriptor2.getName() ) ) ).thenReturn( MixinDescriptors.from( descriptor2 ) );
        when( mixinService.getByName( descriptor2.getName() ) ).thenReturn( descriptor2 );

        when( mixinService.getByApplication( any() ) ).thenReturn( MixinDescriptors.from( descriptor2 ) );

        when( siteConfigService.getSiteConfigs( eq( ContentPath.ROOT ) ) ).thenReturn( SiteConfigs.from(
            SiteConfig.create().application( ApplicationKey.from( "myapplication" ) ).config( new PropertyTree() ).build() ) );

        when( mixinMappingService.getMixinMappingOptions( eq( contentType.getName() ), any() ) ).thenReturn(
            MixinOptions.create().add( new MixinOption( descriptor2, false ) ).build() );

        String result = ContextBuilder.create()
            .repositoryId( project.getName().getRepoId() )
            .build()
            .callWith( () -> request().path( "cms/myproject1/content/schema/mixins/getContentMixins" )
                .queryParam( "contentId", "contentId" )
                .get()
                .getAsString() );

        assertJson( "get_project_mixins.json", result );
    }

    @Test
    public void getApplicationMixinsForContentType()
        throws Exception
    {
        final MixinName qualifiedName1 = MixinName.from( "myapplication:input_text_1" );
        final String myMixinInputName1 = "input_text_1";
        final MixinName qualifiedName2 = MixinName.from( "myapplication:text_area_2" );
        final String myMixinInputName2 = "text_area_2";
        final ContentTypeName contentTypeName = ContentTypeName.from( "app:testContentType" );

        final MixinDescriptor descriptor1 = MixinDescriptor.create().
            createdTime( LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).
            toInstant( ZoneOffset.UTC ) ).
            name( qualifiedName1 ).
            addFormItem( Input.create().
            name( myMixinInputName1 ).
            inputType( InputTypeName.TEXT_LINE ).
            label( "Line Text 1" ).
            required( true ).
            helpText( "Help text line 1" ).
            required( true ).
            build() ).
            build();

        final MixinDescriptor descriptor2 = MixinDescriptor.create().
            createdTime( LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).
            toInstant( ZoneOffset.UTC ) ).
            name( qualifiedName2 ).
            addFormItem( Input.create().
            name( myMixinInputName2 ).
            inputType( InputTypeName.TEXT_AREA ).
            label( "Text Area" ).
            required( true ).
            helpText( "Help text area" ).
            required( true ).
            build() ).
            build();

        final MixinDescriptor descriptor3 = MixinDescriptor.create().
            createdTime( LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).
            toInstant( ZoneOffset.UTC ) ).
            name( MixinName.from( "myapplication:text_area_3" ) ).
            addFormItem( Input.create().
            name( "input_name_3" ).
            inputType( InputTypeName.TEXT_AREA ).
            label( "Text Area" ).
            required( true ).
            helpText( "Help text area" ).
            required( true ).
            build() ).
            build();

        final CmsDescriptor cmsDescriptor = CmsDescriptor.create().
            applicationKey( ApplicationKey.from( "myapplication" ) ).
            mixinMappings( MixinMappings.from( MixinMapping.create().
            allowContentTypes( contentTypeName.toString() ).
            mixinName( descriptor1.getName() ).build(), MixinMapping.create().
            mixinName( descriptor3.getName() ).
            allowContentTypes( "app:anotherContentType" ).
            build() ) ).
            build();

        when( cmsService.getDescriptor( contentTypeName.getApplicationKey() ) ).thenReturn( cmsDescriptor );

        when( mixinService.getByNames( MixinNames.from( descriptor2.getName(), descriptor3.getName() ) ) )
            .thenReturn( MixinDescriptors.from( descriptor2 ) );

        when( mixinService.getByName( descriptor1.getName() ) ).thenReturn( descriptor1 );
        when( mixinService.getByName( descriptor2.getName() ) ).thenReturn( descriptor2 );
        when( mixinService.getByName( descriptor3.getName() ) ).thenReturn( descriptor3 );

        when( mixinService.getByApplication( any() ) ).thenReturn( MixinDescriptors.from( descriptor2 ) );

        when( siteConfigService.getSiteConfigs( any() ) ).thenReturn( SiteConfigs.from(
            SiteConfig.create().application( ApplicationKey.from( "myapplication" ) ).config( new PropertyTree() ).build() ) );

        when( mixinMappingService.getMixinMappingOptions( eq( contentTypeName ), any() ) ).thenReturn(
            MixinOptions.create().add( new MixinOption( descriptor1, false ) ).build() );

        String result = request().path( "cms/default/content/schema/mixins/getApplicationMixinsForContentType" )
            .queryParam( "contentTypeName", contentTypeName.toString() )
            .queryParam( "applicationKey", contentTypeName.getApplicationKey().toString() )
            .
                get().
                getAsString();

        assertJson( "get_content_mixins_for_content_type.json", result );

    }

    private MixinDescriptor generateMixinDescriptor1()
    {
        return MixinDescriptor.create()
            .createdTime( LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).toInstant( ZoneOffset.UTC ) )
            .name( MixinName.from( "myapplication:input_text_1" ) )
            .addFormItem( Input.create()
                              .name( "input_text_1" )
                              .inputType( InputTypeName.TEXT_LINE )
                              .label( "Line Text 1" )
                              .required( true )
                              .helpText( "Help text line 1" )
                              .required( true )
                              .build() )
            .build();
    }

    private MixinDescriptor generateMixinDescriptor2()
    {
        return MixinDescriptor.create()
            .createdTime( LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).toInstant( ZoneOffset.UTC ) )
            .name( MixinName.from( "myapplication:text_area_2" ) )
            .addFormItem( Input.create()
                              .name( "text_area_2" )
                              .inputType( InputTypeName.TEXT_AREA )
                              .label( "Text Area" )
                              .required( true )
                              .helpText( "Help text area" )
                              .required( true )
                              .build() )
            .build();
    }

    private Content mockContent( final ContentTypeName contentTypeName )
    {
        final Content content = mock( Content.class );
        when( content.getType() ).thenReturn( contentTypeName );
        when( content.getName() ).thenReturn( ContentName.from( "content1" ) );
        when( content.getPath() ).thenReturn( ContentPath.from( ContentPath.ROOT, "content1" ) );
        when( content.getId() ).thenReturn( ContentId.from( "contentId" ) );
        return content;
    }

    private ContentType createContentType()
    {
        return ContentType.create().name( "app:testContentType" ).superType( ContentTypeName.folder() ).build();
    }

    private Site createSite( final ApplicationKey applicationKey )
    {
        final SiteConfig siteConfig =
            SiteConfig.create().config( new PropertyTree() ).application( applicationKey ).build();

        final PropertyTree dataSet = new PropertyTree();
        SiteConfigsDataSerializer.toData( SiteConfigs.from( siteConfig ), dataSet.getRoot() );

        return Site.create().name( "site" ).parentPath( ContentPath.ROOT ).data( dataSet ).build();
    }
}
