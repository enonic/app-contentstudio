package com.enonic.xp.app.contentstudio.rest.resource.macro;

import java.util.Collections;
import java.util.Locale;

import org.jboss.resteasy.core.ResteasyContext;
import org.junit.jupiter.api.Test;
import org.mockito.AdditionalAnswers;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.MediaType;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.form.Form;
import com.enonic.xp.form.Input;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.inputtype.InputTypeName;
import com.enonic.xp.macro.MacroDescriptor;
import com.enonic.xp.macro.MacroDescriptorService;
import com.enonic.xp.macro.MacroDescriptors;
import com.enonic.xp.macro.MacroKey;
import com.enonic.xp.portal.PortalResponse;
import com.enonic.xp.portal.macro.MacroContext;
import com.enonic.xp.portal.macro.MacroProcessor;
import com.enonic.xp.portal.macro.MacroProcessorFactory;
import com.enonic.xp.portal.postprocess.HtmlTag;
import com.enonic.xp.portal.url.PortalUrlService;
import com.enonic.xp.schema.mixin.MixinService;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteConfigs;
import com.enonic.xp.site.SiteConfigsDataSerializer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class MacroResourceTest
    extends AdminResourceTestSupport
{

    private MacroDescriptorService macroDescriptorService;

    private MacroProcessorFactory macroProcessorFactory;

    private PortalUrlService portalUrlService;

    private ContentService contentService;

    private LocaleService localeService;

    private MixinService mixinService;

    private static final String DEFAULT_URI_PREFIX = "cms/default/";

    @Override
    protected Object getResourceInstance()
    {
        this.macroDescriptorService = mock( MacroDescriptorService.class );
        this.macroProcessorFactory = mock( MacroProcessorFactory.class );
        this.portalUrlService = mock( PortalUrlService.class );
        this.contentService = mock( ContentService.class );
        this.localeService = mock( LocaleService.class );
        this.mixinService = mock( MixinService.class );

        MacroResource macroResource = new MacroResource();
        macroResource.setMacroDescriptorService( this.macroDescriptorService );
        macroResource.setMacroProcessorFactory( this.macroProcessorFactory );
        macroResource.setPortalUrlService( this.portalUrlService );
        macroResource.setContentService( this.contentService );
        macroResource.setLocaleService( this.localeService );
        macroResource.setMixinService( this.mixinService );

        final HttpServletRequest mockRequest = mock( HttpServletRequest.class );
        when( mockRequest.getServerName() ).thenReturn( "localhost" );
        when( mockRequest.getScheme() ).thenReturn( "http" );
        when( mockRequest.getServerPort() ).thenReturn( 80 );
        when( mockRequest.getLocales() ).thenReturn( Collections.enumeration( Collections.singleton( Locale.US ) ) );
        ResteasyContext.getContextDataMap().put( HttpServletRequest.class, mockRequest );

        return macroResource;
    }

    @Test
    public void testGetByApps()
        throws Exception
    {
        final MacroDescriptor macroDescriptor1 = newMacroDescriptor( "my-app1:macro1", "A macro" );
        final MacroDescriptor macroDescriptor2 = newMacroDescriptor( "my-app2:macro2", "B macro" );
        final MacroDescriptor macroDescriptor3 = newMacroDescriptor( "my-app3:macro3", "C macro" );

        when( this.macroDescriptorService.getByApplication( ApplicationKey.SYSTEM ) )
            .thenReturn( MacroDescriptors.from( macroDescriptor1 ) );
        when( this.macroDescriptorService.getByApplication( ApplicationKey.from( "appKey1" ) ) )
            .thenReturn( MacroDescriptors.from( macroDescriptor2 ) );
        when( this.macroDescriptorService.getByApplication( ApplicationKey.from( "appKey2" ) ) )
            .thenReturn( MacroDescriptors.from( macroDescriptor3 ) );

        when( mixinService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        String response = request().
            path( DEFAULT_URI_PREFIX + "macro/getByApps" ).
            entity( "{\"appKeys\": [\"appKey1\", \"appKey2\"]}", MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertJson( "get_macros.json", response );
    }

    @Test
    public void testGetByApps_i18n()
        throws Exception
    {
        final Form descriptorForm = Form.create().
            addFormItem( Input.create().
                name( "columns" ).
                maximizeUIInputWidth( true ).
                label( "Columns" ).
                labelI18nKey( "key.label" ).
                helpTextI18nKey( "key.help-text" ).
                inputType( InputTypeName.DOUBLE ).
                build() ).
            build();

        final MacroDescriptor macroDescriptor1 = newMacroDescriptor( "my-app1:macro1", "A macro", "key.a.display-name", descriptorForm );
        final MacroDescriptor macroDescriptor2 = newMacroDescriptor( "my-app2:macro2", "B macro", "key.b.display-name", "key.description" );
        final MacroDescriptor macroDescriptor3 = newMacroDescriptor( "my-app3:macro3", "C macro", "key.c.display-name" );

        when( this.macroDescriptorService.getByApplication( ApplicationKey.SYSTEM ) )
            .thenReturn( MacroDescriptors.from( macroDescriptor1 ) );
        when( this.macroDescriptorService.getByApplication( ApplicationKey.from( "appKey1" ) ) )
            .thenReturn( MacroDescriptors.from( macroDescriptor2 ) );
        when( this.macroDescriptorService.getByApplication( ApplicationKey.from( "appKey2" ) ) )
            .thenReturn( MacroDescriptors.from( macroDescriptor3 ) );

        final MessageBundle messageBundle = mock( MessageBundle.class );
        when( messageBundle.localize( "key.label" ) ).thenReturn( "translated.label" );
        when( messageBundle.localize( "key.help-text" ) ).thenReturn( "translated.helpText" );
        when( messageBundle.localize( "key.description" ) ).thenReturn( "translated.description" );
        when( messageBundle.localize( "key.a.display-name" ) ).thenReturn( "translated.A.displayName" );
        when( messageBundle.localize( "key.b.display-name" ) ).thenReturn( "translated.B.displayName" );
        when( messageBundle.localize( "key.c.display-name" ) ).thenReturn( "translated.C.displayName" );

        when( this.localeService.getBundle( any(), any() ) ).thenReturn( messageBundle );
        when( mixinService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        String response = request().
            path( DEFAULT_URI_PREFIX + "macro/getByApps" ).
            entity( "{\"appKeys\": [\"appKey1\", \"appKey2\"]}", MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertJson( "get_macros_i18n.json", response );
    }

    @Test
    public void testPreview()
        throws Exception
    {
        final Form form = Form.create().build();
        final MacroDescriptor macroDescriptor = MacroDescriptor.create().
            key( MacroKey.from( "test:uppercase" ) ).
            description( "Uppercase macro" ).
            displayName( "Uppercase macro" ).
            form( form ).
            build();

        final MacroProcessor macroProcessor = ( MacroContext macroContext ) -> {
            final String textParams = macroContext.getBody() + "," + macroContext.getParameter( "param1" );
            return PortalResponse.create().
                body( textParams.toUpperCase() ).
                contribution( HtmlTag.BODY_END, "<script type='text/javascript' src='some.js'></script>" ).
                build();
        };

        when( this.macroDescriptorService.getByKey( MacroKey.from( "test:uppercase" ) ) ).thenReturn( macroDescriptor );
        when( this.macroProcessorFactory.fromScript( any() ) ).thenReturn( macroProcessor );
        when( this.portalUrlService.pageUrl( any() ) ).thenReturn( "/site/preview/draft/mysite/page" );

        final Site site = newSite();
        when( this.contentService.getByPath( any() ) ).thenReturn( site );
        when( this.contentService.getNearestSite( any() ) ).thenReturn( site );

        final HttpServletRequest mockRequest = mock( HttpServletRequest.class );
        when( mockRequest.getServerName() ).thenReturn( "localhost" );
        when( mockRequest.getScheme() ).thenReturn( "http" );
        when( mockRequest.getServerPort() ).thenReturn( 80 );
        when( mockRequest.getHeaderNames() ).thenReturn( Collections.emptyEnumeration() );
        ResteasyContext.getContextDataMap().put( HttpServletRequest.class, mockRequest );

        String response = request().path( DEFAULT_URI_PREFIX + "macro/preview" ).
            entity( readFromFile( "preview_macro_params.json" ), MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertJson( "preview_macro_result.json", response );
    }


    @Test
    public void testPreviewString()
        throws Exception
    {
        final Form form = Form.create().build();
        final MacroDescriptor macroDescriptor = MacroDescriptor.create().
            key( MacroKey.from( "test:uppercase" ) ).
            description( "Uppercase macro" ).
            displayName( "Uppercase macro" ).
            form( form ).
            build();

        when( this.macroDescriptorService.getByKey( MacroKey.from( "test:uppercase" ) ) ).thenReturn( macroDescriptor );

        String response = request().path( DEFAULT_URI_PREFIX + "macro/previewString" ).
            entity( readFromFile( "preview_string_macro_params.json" ), MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertJson( "preview_string_macro_result.json", response );
    }

    private MacroDescriptor newMacroDescriptor( final String key, final String name, final String nameI18nKey, final Form config )
    {
        final MacroDescriptor macroDescriptor = MacroDescriptor.create().
            key( MacroKey.from( key ) ).
            description( "my description" ).
            displayName( name ).
            displayNameI18nKey( nameI18nKey ).
            form( config ).
            build();

        return macroDescriptor;
    }

    private MacroDescriptor newMacroDescriptor( final String key, final String name, final String nameI18nKey,
                                                final String descriptionI18nKey )
    {
        final Form config = Form.create().build();

        final MacroDescriptor macroDescriptor = MacroDescriptor.create().
            key( MacroKey.from( key ) ).
            description( "my description" ).
            descriptionI18nKey( descriptionI18nKey ).
            displayName( name ).
            displayNameI18nKey( nameI18nKey ).
            form( config ).
            build();

        return macroDescriptor;
    }

    private MacroDescriptor newMacroDescriptor( final String key, final String name, final String nameI18nKey )
    {
        final Form config = Form.create().build();

        return this.newMacroDescriptor( key, name, nameI18nKey, config );
    }

    private MacroDescriptor newMacroDescriptor( final String key, final String name )
    {
        return this.newMacroDescriptor( key, name, null );
    }

    public static Site newSite()
    {
        final PropertyTree siteConfigConfig = new PropertyTree();
        siteConfigConfig.setLong( "Field", 42L );
        final SiteConfig siteConfig = SiteConfig.create().
            application( ApplicationKey.from( "myapp" ) ).
            config( siteConfigConfig ).
            build();

        final PropertyTree dataSet = new PropertyTree();
        SiteConfigsDataSerializer.toData( SiteConfigs.from( siteConfig ), dataSet.getRoot() );

        final Site.Builder site = Site.create();
        site.id( ContentId.from( "1004242" ) );
        site.data( dataSet );
        site.name( "my-content" );
        site.parentPath( ContentPath.ROOT );
        return site.build();
    }
}
