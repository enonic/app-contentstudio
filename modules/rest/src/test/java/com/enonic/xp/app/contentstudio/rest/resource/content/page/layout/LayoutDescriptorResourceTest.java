package com.enonic.xp.app.contentstudio.rest.resource.content.page.layout;

import javax.ws.rs.core.MediaType;

import org.junit.jupiter.api.Test;
import org.mockito.AdditionalAnswers;
import org.mockito.Mockito;

import com.enonic.xp.app.ApplicationKeys;
import com.enonic.xp.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.app.contentstudio.rest.resource.content.JsonObjectsFactory;
import com.enonic.xp.form.Form;
import com.enonic.xp.form.Input;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.inputtype.InputTypeName;
import com.enonic.xp.page.DescriptorKey;
import com.enonic.xp.region.LayoutDescriptor;
import com.enonic.xp.region.LayoutDescriptorService;
import com.enonic.xp.region.LayoutDescriptors;
import com.enonic.xp.region.RegionDescriptor;
import com.enonic.xp.region.RegionDescriptors;
import com.enonic.xp.schema.mixin.MixinService;

public class LayoutDescriptorResourceTest
    extends AdminResourceTestSupport
{
    private LayoutDescriptorService layoutDescriptorService;

    private LocaleService localeService;

    private MixinService mixinService;

    @Override
    protected Object getResourceInstance()
    {
        layoutDescriptorService = Mockito.mock( LayoutDescriptorService.class );
        localeService = Mockito.mock( LocaleService.class );
        mixinService = Mockito.mock( MixinService.class );

        final JsonObjectsFactory jsonObjectsFactory = new JsonObjectsFactory();
        jsonObjectsFactory.setLocaleService( localeService );
        jsonObjectsFactory.setMixinService( mixinService );
        final LayoutDescriptorResource resource = new LayoutDescriptorResource();
        resource.setLayoutDescriptorService( layoutDescriptorService );
        resource.setJsonObjectsFactory( jsonObjectsFactory );

        return resource;
    }

    @Test
    public void test_get_by_key()
        throws Exception
    {
        final DescriptorKey key = DescriptorKey.from( "application:fancy-layout" );
        final Form layoutForm = Form.create().
            addFormItem( Input.create().
                name( "columns" ).
                maximizeUIInputWidth( true ).
                label( "Columns" ).
                inputType( InputTypeName.DOUBLE ).
                build() ).
            build();

        final LayoutDescriptor layoutDescriptor = LayoutDescriptor.create().
            displayName( "Fancy layout" ).
            description( "description" ).
            config( layoutForm ).
            regions( RegionDescriptors.create().
                add( RegionDescriptor.create().name( "left" ).build() ).
                add( RegionDescriptor.create().name( "right" ).build() ).
                build() ).
            key( key ).
            build();

        Mockito.when( layoutDescriptorService.getByKey( key ) ).thenReturn( layoutDescriptor );
        Mockito.when( mixinService.inlineFormItems( Mockito.isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        String jsonString = request().path( "content/page/layout/descriptor" ).
            queryParam( "key", "application:fancy-layout" ).get().getAsString();

        assertJson( "get_by_key_success.json", jsonString );
    }

    @Test
    public void test_get_by_key_i18n()
        throws Exception
    {
        final DescriptorKey key = DescriptorKey.from( "application:fancy-layout" );
        final Form layoutForm = Form.create().
            addFormItem( Input.create().
                name( "columns" ).
                maximizeUIInputWidth( true ).
                label( "Columns" ).
                labelI18nKey( "key.label" ).
                helpTextI18nKey( "key.help-text" ).
                inputType( InputTypeName.DOUBLE ).
                build() ).
            build();

        final LayoutDescriptor layoutDescriptor = LayoutDescriptor.create().
            displayName( "Fancy layout" ).
            displayNameI18nKey( "key.display-name" ).
            description( "description" ).
            descriptionI18nKey( "key.description" ).
            config( layoutForm ).
            regions( RegionDescriptors.create().
                add( RegionDescriptor.create().name( "left" ).build() ).
                add( RegionDescriptor.create().name( "right" ).build() ).
                build() ).
            key( key ).
            build();

        Mockito.when( layoutDescriptorService.getByKey( key ) ).thenReturn( layoutDescriptor );

        final MessageBundle messageBundle = Mockito.mock( MessageBundle.class );
        Mockito.when( messageBundle.localize( "key.label" ) ).thenReturn( "translated.label" );
        Mockito.when( messageBundle.localize( "key.help-text" ) ).thenReturn( "translated.helpText" );
        Mockito.when( messageBundle.localize( "key.display-name" ) ).thenReturn( "translated.displayName" );
        Mockito.when( messageBundle.localize( "key.description" ) ).thenReturn( "translated.description" );

        Mockito.when( this.localeService.getBundle( Mockito.any(), Mockito.any() ) ).thenReturn( messageBundle );
        Mockito.when( mixinService.inlineFormItems( Mockito.isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        String jsonString = request().path( "content/page/layout/descriptor" ).
            queryParam( "key", "application:fancy-layout" ).get().getAsString();

        assertJson( "get_by_key_i18n.json", jsonString );
    }

    @Test
    public void test_get_by_applications()
        throws Exception
    {
        final Form layoutForm = Form.create().
            addFormItem( Input.create().name( "columns" ).label( "Columns" ).inputType( InputTypeName.DOUBLE ).build() ).
            build();

        final LayoutDescriptor layoutDescriptor1 = LayoutDescriptor.create().
            displayName( "Fancy layout" ).
            description( "description 1" ).
            config( layoutForm ).
            regions( RegionDescriptors.create().
                add( RegionDescriptor.create().name( "left" ).build() ).
                add( RegionDescriptor.create().name( "right" ).build() ).
                build() ).
            key( DescriptorKey.from( "application:fancy-layout" ) ).
            build();

        final LayoutDescriptor layoutDescriptor2 = LayoutDescriptor.create()
            .displayName( "Putty layout" )
            .description( "description 2" )
            .config( layoutForm )
            .regions( RegionDescriptors.create()
                          .add( RegionDescriptor.create().name( "top" ).build() )
                          .add( RegionDescriptor.create().name( "bottom" ).build() )
                          .build() )
            .key( DescriptorKey.from( "application:putty-layout" ) )
            .build();

        Mockito.when( layoutDescriptorService.getByApplications( ApplicationKeys.from( "application1", "application2", "application3" ) ) )
            .thenReturn( LayoutDescriptors.from( layoutDescriptor1, layoutDescriptor2 ) );
        Mockito.when( mixinService.inlineFormItems( Mockito.isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        String jsonString = request().path( "content/page/layout/descriptor/list/by_applications" )
            .entity( readFromFile( "get_by_applications_params.json" ), MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "get_by_applications_success.json", jsonString );
    }
}
