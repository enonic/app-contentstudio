package com.enonic.xp.app.contentstudio.rest.resource.schema.xdata;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;
import org.mockito.AdditionalAnswers;
import org.mockito.Mockito;

import com.enonic.xp.app.contentstudio.rest.AdminRestConfig;
import com.enonic.xp.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.form.Form;
import com.enonic.xp.form.Input;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.inputtype.InputTypeName;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.schema.mixin.Mixins;
import com.enonic.xp.schema.xdata.XData;
import com.enonic.xp.schema.xdata.XDataName;
import com.enonic.xp.schema.xdata.XDataNames;
import com.enonic.xp.schema.xdata.XDataService;
import com.enonic.xp.schema.xdata.XDatas;
import com.enonic.xp.site.SiteDescriptor;
import com.enonic.xp.site.SiteService;
import com.enonic.xp.site.XDataMapping;
import com.enonic.xp.site.XDataMappings;

import static org.mockito.Mockito.when;

public class XDataResourceTest
    extends AdminResourceTestSupport
{

    private static final XDataName MY_XDATA_QUALIFIED_NAME_1 = XDataName.from( "myapplication:input_text_1" );

    private static final String MY_MIXIN_INPUT_NAME_1 = "input_text_1";

    private static final XDataName MY_XDATA_QUALIFIED_NAME_2 = XDataName.from( "myapplication:text_area_2" );

    private static final String MY_MIXIN_INPUT_NAME_2 = "text_area_2";

    private MixinService mixinService;

    private XDataService xDataService;

    private LocaleService localeService;

    private SiteService siteService;

    @Override
    protected XDataResource getResourceInstance()
    {
        mixinService = Mockito.mock( MixinService.class );
        xDataService = Mockito.mock( XDataService.class );
        localeService = Mockito.mock( LocaleService.class );
        siteService = Mockito.mock( SiteService.class );

        final XDataResource resource = new XDataResource();
        resource.setMixinService( mixinService );
        resource.setXDataService( xDataService );
        resource.setLocaleService( localeService );
        resource.setSiteService( siteService );

        final AdminRestConfig config = Mockito.mock( AdminRestConfig.class );
        when( config.contentTypePatternMode() ).thenReturn( "MATCH" );

        resource.activate( config );

        Mockito.when( mixinService.inlineFormItems( Mockito.isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        return resource;
    }

    @Test
    public void getApplicationXDataForContentType()
        throws Exception
    {

        final ContentTypeName contentTypeName = ContentTypeName.from( "app:testContentType" );

        final XData xdata1 = XData.create().
            createdTime( LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).
                toInstant( ZoneOffset.UTC ) ).
            name( MY_XDATA_QUALIFIED_NAME_1 ).
            addFormItem( Input.create().
                name( MY_MIXIN_INPUT_NAME_1 ).
                inputType( InputTypeName.TEXT_LINE ).
                label( "Line Text 1" ).
                required( true ).
                helpText( "Help text line 1" ).
                required( true ).
                build() ).
            build();

        final XData xdata2 = XData.create().
            createdTime( LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).
                toInstant( ZoneOffset.UTC ) ).
            name( MY_XDATA_QUALIFIED_NAME_2 ).
            addFormItem( Input.create().
                name( MY_MIXIN_INPUT_NAME_2 ).
                inputType( InputTypeName.TEXT_AREA ).
                label( "Text Area" ).
                required( true ).
                helpText( "Help text area" ).
                required( true ).
                build() ).
            build();

        final XData xdata3 = XData.create().
            createdTime( LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).
                toInstant( ZoneOffset.UTC ) ).
            name( XDataName.from( "myapplication:text_area_3" ) ).
            addFormItem( Input.create().
                name( "input_name_3" ).
                inputType( InputTypeName.TEXT_AREA ).
                label( "Text Area" ).
                required( true ).
                helpText( "Help text area" ).
                required( true ).
                build() ).
            build();

        final SiteDescriptor siteDescriptor = SiteDescriptor.create().
            xDataMappings( XDataMappings.from( XDataMapping.create().
                allowContentTypes( contentTypeName.toString() ).
                xDataName( xdata1.getName() ).build(), XDataMapping.create().
                xDataName( xdata3.getName() ).
                allowContentTypes( "app:anotherContentType" ).
                build() ) ).
            build();

        Mockito.when( siteService.getDescriptor( contentTypeName.getApplicationKey() ) ).thenReturn( siteDescriptor );

        Mockito.when( mixinService.getByNames( Mockito.any() ) ).thenReturn( Mixins.empty() );
        Mockito.when( xDataService.getByNames( XDataNames.from( xdata2.getName().toString(), xdata3.getName().toString() ) ) )
            .thenReturn( XDatas.from( xdata2 ) );

        Mockito.when( xDataService.getByName( xdata1.getName() ) ).thenReturn( xdata1 );
        Mockito.when( xDataService.getByName( xdata2.getName() ) ).thenReturn( xdata2 );
        Mockito.when( xDataService.getByName( xdata3.getName() ) ).thenReturn( xdata3 );

        Mockito.when( xDataService.getByApplication( Mockito.any() ) ).thenReturn( XDatas.from( xdata2 ) );

        String result = request().path( "schema/xdata/getApplicationXDataForContentType" ).
            queryParam( "contentTypeName", contentTypeName.toString() ).
            queryParam( "applicationKey", contentTypeName.getApplicationKey().toString() ).
            get().
            getAsString();

        assertJson( "get_content_x_data_for_content_type.json", result );

    }
}
