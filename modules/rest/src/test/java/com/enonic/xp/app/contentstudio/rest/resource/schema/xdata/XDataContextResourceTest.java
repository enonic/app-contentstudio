package com.enonic.xp.app.contentstudio.rest.resource.schema.xdata;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;
import org.mockito.AdditionalAnswers;
import org.mockito.Mockito;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.contentstudio.rest.AdminRestConfig;
import com.enonic.xp.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
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
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.ContentTypes;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.schema.mixin.Mixins;
import com.enonic.xp.schema.xdata.XData;
import com.enonic.xp.schema.xdata.XDataName;
import com.enonic.xp.schema.xdata.XDataNames;
import com.enonic.xp.schema.xdata.XDataService;
import com.enonic.xp.schema.xdata.XDatas;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteDescriptor;
import com.enonic.xp.site.SiteService;
import com.enonic.xp.site.XDataMapping;
import com.enonic.xp.site.XDataMappings;

import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.when;

public class XDataContextResourceTest
    extends AdminResourceTestSupport
{
    private MixinService mixinService;

    private XDataService xDataService;

    private LocaleService localeService;

    private ContentService contentService;

    private SiteService siteService;

    private ContentTypeService contentTypeService;

    private ProjectService projectService;

    @Override
    protected XDataContextResource getResourceInstance()
    {
        mixinService = Mockito.mock( MixinService.class );
        xDataService = Mockito.mock( XDataService.class );
        localeService = Mockito.mock( LocaleService.class );
        contentService = Mockito.mock( ContentService.class );
        siteService = Mockito.mock( SiteService.class );
        contentTypeService = Mockito.mock( ContentTypeService.class );
        projectService = Mockito.mock( ProjectService.class );

        final XDataContextResource resource = new XDataContextResource();
        resource.setMixinService( mixinService );
        resource.setXDataService( xDataService );
        resource.setLocaleService( localeService );
        resource.setContentService( contentService );
        resource.setSiteService( siteService );
        resource.setContentTypeService( contentTypeService );
        resource.setProjectService( projectService );

        final AdminRestConfig config = Mockito.mock( AdminRestConfig.class );
        when( config.contentTypePatternMode() ).thenReturn( "MATCH" );

        resource.activate( config );

        Mockito.when( mixinService.inlineFormItems( Mockito.isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        return resource;
    }

    @Test
    public void getContentXDataMultipleConfig()
        throws Exception
    {
        final XData xdata1 = generateXData1();
        final ContentType contentType = mockContentType( XDataNames.empty() );
        final Content content = mockContent( contentType.getName() );
        final Site site = createSite( contentType.getName().getApplicationKey() );

        final SiteDescriptor siteDescriptor = SiteDescriptor.create()
            .xDataMappings( XDataMappings.from(
                XDataMapping.create().xDataName( xdata1.getName() ).allowContentTypes( "app:testContentType" ).optional( true ).build(),
                XDataMapping.create().xDataName( xdata1.getName() ).allowContentTypes( "app:testContentType" ).optional( false ).build() ) )
            .build();

        Mockito.when( siteService.getDescriptor( contentType.getName().getApplicationKey() ) ).thenReturn( siteDescriptor );

        Mockito.when( contentService.getById( ContentId.from( "contentId" ) ) ).thenReturn( content );
        Mockito.when( contentService.getNearestSite( ContentId.from( "contentId" ) ) ).thenReturn( site );

        Mockito.when( mixinService.getByNames( Mockito.any() ) ).thenReturn( Mixins.empty() );
        Mockito.when( xDataService.getByNames( XDataNames.from( xdata1.getName() ) ) ).thenReturn( XDatas.from( xdata1 ) );
        Mockito.when( xDataService.getByNames( XDataNames.empty() ) ).thenReturn( XDatas.empty() );
        Mockito.when( xDataService.getByName( xdata1.getName() ) ).thenReturn( xdata1 );

        String result =
            request().path( "cms/default/content/schema/xdata/getContentXData" ).queryParam( "contentId", "contentId" ).get().getAsString();

        assertJson( "get_content_x_data_duplicated_config.json", result );
    }

    @Test
    public void getContentXData()
        throws Exception
    {
        final XData xdata1 = generateXData1();
        final XData xdata2 = generateXData2();
        final ContentType contentType = mockContentType( XDataNames.from( xdata1.getName().toString() ) );
        final Content content = mockContent( contentType.getName() );
        final Site site = createSite( contentType.getName().getApplicationKey() );

        final SiteDescriptor siteDescriptor = SiteDescriptor.create()
            .xDataMappings( XDataMappings.from(
                XDataMapping.create().xDataName( xdata2.getName() ).allowContentTypes( "app:testContentType|^app:*" ).build() ) )
            .build();

        Mockito.when( siteService.getDescriptor( contentType.getName().getApplicationKey() ) ).thenReturn( siteDescriptor );

        Mockito.when( contentService.getById( ContentId.from( "contentId" ) ) ).thenReturn( content );
        Mockito.when( contentService.getNearestSite( ContentId.from( "contentId" ) ) ).thenReturn( site );

        Mockito.when( mixinService.getByNames( Mockito.any() ) ).thenReturn( Mixins.empty() );
        Mockito.when( xDataService.getByNames( XDataNames.from( xdata1.getName() ) ) ).thenReturn( XDatas.from( xdata1 ) );
        Mockito.when( xDataService.getByNames( XDataNames.from( xdata2.getName() ) ) ).thenReturn( XDatas.from( xdata2 ) );
        Mockito.when( xDataService.getByName( xdata2.getName() ) ).thenReturn( xdata2 );

        Mockito.when( xDataService.getByApplication( Mockito.any() ) ).thenReturn( XDatas.from( xdata2 ) );

        String result =
            request().path( "cms/default/content/schema/xdata/getContentXData" ).queryParam( "contentId", "contentId" ).get().getAsString();

        assertJson( "get_content_x_data.json", result );
    }

    @Test
    public void getContentXDataNoSiteDescriptor()
        throws Exception
    {
        final XData xdata1 = generateXData1();
        final ContentType contentType = mockContentType( XDataNames.from( xdata1.getName().toString() ) );
        final Content content = mockContent( contentType.getName() );
        final Site site = createSite( contentType.getName().getApplicationKey() );

        Mockito.when( siteService.getDescriptor( contentType.getName().getApplicationKey() ) ).thenReturn( null );

        Mockito.when( contentService.getById( ContentId.from( "contentId" ) ) ).thenReturn( content );
        Mockito.when( contentService.getNearestSite( ContentId.from( "contentId" ) ) ).thenReturn( site );

        Mockito.when( mixinService.getByNames( Mockito.any() ) ).thenReturn( Mixins.empty() );
        Mockito.when( xDataService.getByNames( XDataNames.from( xdata1.getName() ) ) ).thenReturn( XDatas.from( xdata1 ) );

        String result =
            request().path( "cms/default/content/schema/xdata/getContentXData" ).queryParam( "contentId", "contentId" ).get().getAsString();

        assertJson( "get_content_x_data_no_site_descriptor.json", result );
    }

    @Test
    public void getProjectXData()
        throws Exception
    {
        final XData xdata1 = generateXData1();
        final XData xdata2 = generateXData2();

        final ContentType contentType = mockContentType( XDataNames.from( xdata1.getName().toString() ) );
        final Content content = mockContent( contentType.getName() );

        final SiteDescriptor siteDescriptor = SiteDescriptor.create()
            .xDataMappings( XDataMappings.from(
                XDataMapping.create().xDataName( xdata2.getName() ).allowContentTypes( "app:testContentType|^app:*" ).build() ) )
            .build();

        final Project project = Project.create()
            .name( ProjectName.from( "myproject") )
            .displayName( "project" )
            .addSiteConfig( SiteConfig.create().application( ApplicationKey.from( "myapplication" ) ).config( new PropertyTree() ).build() )
            .build();

        Mockito.when( projectService.get( isA( ProjectName.class ) ) ).thenReturn( project );

        Mockito.when( siteService.getDescriptor( ApplicationKey.from( "myapplication" ) ) ).thenReturn( siteDescriptor );

        Mockito.when( contentService.getById( ContentId.from( "contentId" ) ) ).thenReturn( content );

        Mockito.when( mixinService.getByNames( Mockito.any() ) ).thenReturn( Mixins.empty() );
        Mockito.when( xDataService.getByNames( XDataNames.from( xdata1.getName() ) ) ).thenReturn( XDatas.from( xdata1 ) );
        Mockito.when( xDataService.getByNames( XDataNames.from( xdata2.getName() ) ) ).thenReturn( XDatas.from( xdata2 ) );
        Mockito.when( xDataService.getByName( xdata2.getName() ) ).thenReturn( xdata2 );

        Mockito.when( xDataService.getByApplication( Mockito.any() ) ).thenReturn( XDatas.from( xdata2 ) );

        String result = ContextBuilder.create()
            .repositoryId( project.getName().getRepoId() )
            .build()
            .callWith( () -> request().path( "cms/myproject1/content/schema/xdata/getContentXData" )
                .queryParam( "contentId", "contentId" )
                .get()
                .getAsString() );

        assertJson( "get_content_x_data.json", result );
    }

    private XData generateXData1()
    {
        return XData.create()
            .createdTime( LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).toInstant( ZoneOffset.UTC ) )
            .name( XDataName.from( "myapplication:input_text_1" ) )
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

    private XData generateXData2()
    {
        return XData.create()
            .createdTime( LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).toInstant( ZoneOffset.UTC ) )
            .name( XDataName.from( "myapplication:text_area_2" ) )
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
        final Content content = Mockito.mock( Content.class );
        Mockito.when( content.getType() ).thenReturn(contentTypeName );
        Mockito.when( content.getId() ).thenReturn( ContentId.from( "contentId" ) );
        return content;
    }

    private ContentType mockContentType( final XDataNames xDataNames )
    {
        final ContentType contentType = ContentType.create()
            .name( "app:testContentType" )
            .superType( ContentTypeName.folder() )
            .xData( xDataNames )
            .build();
        Mockito.when( contentTypeService.getByName( GetContentTypeParams.from( contentType.getName() ) ) ).thenReturn( contentType );
        Mockito.when( contentTypeService.getAll() ).thenReturn( ContentTypes.from( contentType ) );

        return contentType;
    }

    private Site createSite( final ApplicationKey applicationKey )
    {
        final SiteConfig siteConfig =
            SiteConfig.create().config( new PropertyTree() ).application( applicationKey ).build();

        return Site.create().name( "site" ).parentPath( ContentPath.ROOT ).addSiteConfig( siteConfig ).build();
    }
}
