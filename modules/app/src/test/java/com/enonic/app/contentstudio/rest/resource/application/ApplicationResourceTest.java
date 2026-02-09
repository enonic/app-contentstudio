package com.enonic.app.contentstudio.rest.resource.application;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.Locale;

import org.jboss.resteasy.core.ResteasyContext;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.AdditionalAnswers;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import com.enonic.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.app.Application;
import com.enonic.xp.app.ApplicationDescriptor;
import com.enonic.xp.app.ApplicationDescriptorService;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationService;
import com.enonic.xp.app.Applications;
import com.enonic.xp.form.Form;
import com.enonic.xp.form.Input;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.idprovider.IdProviderDescriptor;
import com.enonic.xp.idprovider.IdProviderDescriptorService;
import com.enonic.xp.inputtype.InputTypeName;
import com.enonic.xp.schema.content.CmsFormFragmentService;
import com.enonic.xp.site.CmsDescriptor;
import com.enonic.xp.site.CmsService;
import com.enonic.xp.util.Version;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class ApplicationResourceTest
    extends AdminResourceTestSupport
{
    private ApplicationService applicationService;

    private ApplicationDescriptorService applicationDescriptorService;

    private CmsService cmsService;

    private IdProviderDescriptorService idProviderDescriptorService;

    private LocaleService localeService;

    private CmsFormFragmentService formFragmentService;

    @BeforeEach
    public void setup()
    {
        final HttpServletRequest mockRequest = mock( HttpServletRequest.class );
        when( mockRequest.getServerName() ).thenReturn( "localhost" );
        when( mockRequest.getScheme() ).thenReturn( "http" );
        when( mockRequest.getServerPort() ).thenReturn( 80 );
        when( mockRequest.getLocales() ).thenReturn( Collections.enumeration( Collections.singleton( Locale.US ) ) );
        ResteasyContext.getContextDataMap().put( HttpServletRequest.class, mockRequest );
    }

    @Test
    public void get_application_by_key()
        throws Exception
    {
        final Application application = createApplication();
        when( this.applicationService.getInstalledApplication( isA( ApplicationKey.class ) ) ).thenReturn( application );
        final CmsDescriptor cmsDescriptor = createCmsDescriptor();
        when( this.cmsService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( cmsDescriptor );
        final IdProviderDescriptor idProviderDescriptor = createIdProviderDescriptor();
        when( this.idProviderDescriptorService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( idProviderDescriptor );
        final ApplicationDescriptor appDescriptor = createApplicationDescriptor();
        when( this.applicationDescriptorService.get( isA( ApplicationKey.class ) ) ).thenReturn( appDescriptor );

        when( formFragmentService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        String response = request().
            path( "application" ).
            queryParam( "applicationKey", "testapplication" ).
            get().getAsString();
        assertJson( "get_application_by_key_success.json", response );
    }

    @Test
    public void get_by_keys()
        throws Exception
    {
        final Application application = createApplication();
        when( this.applicationService.get( isA( ApplicationKey.class ) ) ).thenReturn( application );
        final CmsDescriptor cmsDescriptor = createCmsDescriptor();
        when( this.cmsService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( cmsDescriptor );
        final IdProviderDescriptor idProviderDescriptor = createIdProviderDescriptor();
        when( this.idProviderDescriptorService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( idProviderDescriptor );
        final ApplicationDescriptor appDescriptor = createApplicationDescriptor();
        when( this.applicationDescriptorService.get( isA( ApplicationKey.class ) ) ).thenReturn( appDescriptor );

        when( formFragmentService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        String response = request().path( "application/getApplicationsByKeys" )
            .entity( "{\"applicationKeys\":[\"project1\"]}", MediaType.APPLICATION_JSON_TYPE )
            .post()
            .getAsString();

        assertJson( "get_applications_by_keys_success.json", response );
    }

    @Test
    public void get_application_i18n()
        throws Exception
    {
        final Application application = createApplication();
        when( this.applicationService.getInstalledApplication( isA( ApplicationKey.class ) ) ).thenReturn( application );
        final CmsDescriptor cmsDescriptor = createCmsDescriptor();
        when( this.cmsService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( cmsDescriptor );
        final IdProviderDescriptor idProviderDescriptor = createIdProviderDescriptor();
        when( this.idProviderDescriptorService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( idProviderDescriptor );
        final ApplicationDescriptor appDescriptor = createApplicationDescriptor();
        when( this.applicationDescriptorService.get( isA( ApplicationKey.class ) ) ).thenReturn( appDescriptor );

        final MessageBundle messageBundle = mock( MessageBundle.class );
        when( messageBundle.localize( "key.label" ) ).thenReturn( "translated.label" );
        when( messageBundle.localize( "key.help-text" ) ).thenReturn( "translated.helpText" );

        when( messageBundle.localize( "site.config.helpText" ) ).thenReturn( "translated.site.helpText" );
        when( messageBundle.localize( "site.config.label" ) ).thenReturn( "translated.site.label" );

        when( this.localeService.getBundle( any(), any() ) ).thenReturn( messageBundle );

        when( formFragmentService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        String response = request().
            path( "application" ).
            queryParam( "applicationKey", "testapplication" ).
            get().getAsString();
        assertJson( "get_application_i18n.json", response );
    }

    @Test
    public void get_site_applications_validQuery()
        throws Exception
    {
        final Application application = createApplication();
        final Applications applications = Applications.from( application );
        when( this.applicationService.list() ).thenReturn( applications );

        final CmsDescriptor cmsDescriptor = createCmsDescriptor();
        when( this.cmsService.getDescriptor( isA( ApplicationKey.class ) ) ).thenReturn( cmsDescriptor );

        final ApplicationDescriptor appDescriptor = createApplicationDescriptor();
        when( this.applicationDescriptorService.get( isA( ApplicationKey.class ) ) ).thenReturn( appDescriptor );

        when( formFragmentService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        String response = request().
            path( "application/getSiteApplications" ).
            queryParam( "query", "" ).
            get().getAsString();
        assertJson( "get_site_applications.json", response );
    }

    @Test
    public void get_site_applications_empty()
        throws Exception
    {
        final Application application = createApplication();
        final Applications applications = Applications.from( application );
        when( this.applicationService.list() ).thenReturn( applications );

        String response = request().
            path( "application/getSiteApplications" ).
            queryParam( "query", "skip all applications" ).
            get().getAsString();
        assertEquals( "{\"applications\":[],\"total\":0}", response );
    }

    @Test
    public void getIconDefault()
        throws Exception
    {
        String response = request().
            path( "application/icon/applicationKey" ).
            queryParam( "appKey", "applicationKey" ).
            queryParam( "hash", "123" ).
            get().getDataAsString();

        String expected = (String) Response.ok( readFromFile( "application.svg" ), "image/svg+xml" ).build().getEntity();

        Assertions.assertEquals( expected, response );
    }

    @Test
    public void getIcon()
        throws Exception
    {
        final Icon icon = Icon.from( new byte[]{0, 1, 2}, "image/png", Instant.now() );

        final ApplicationDescriptor appDescriptor = createApplicationDescriptor( icon );
        when( this.applicationDescriptorService.get( isA( ApplicationKey.class ) ) ).thenReturn( appDescriptor );

        byte[] response = request().
            path( "application/icon/applicationKey" ).
            queryParam( "appKey", "applicationKey" ).
            queryParam( "hash", "123" ).
            get().getData();

        byte[] expected = icon.toByteArray();

        Assertions.assertTrue( Arrays.equals( expected, response ) );
    }

    private Application createApplication()
    {
        final Application application = mock( Application.class );
        when( application.getKey() ).thenReturn( ApplicationKey.from( "testapplication" ) );
        when( application.getVersion() ).thenReturn( Version.parseVersion( "1.0.0" ) );
        when( application.getDisplayName() ).thenReturn( "application display name" );
        when( application.getUrl() ).thenReturn( "http://enonic.net" );
        when( application.getVendorName() ).thenReturn( "Enonic" );
        when( application.getVendorUrl() ).thenReturn( "https://www.enonic.com" );
        when( application.getMinSystemVersion() ).thenReturn( "5.0" );
        when( application.getMaxSystemVersion() ).thenReturn( "5.1" );
        when( application.isStarted() ).thenReturn( true );
        when( application.getModifiedTime() ).thenReturn( Instant.parse( "2012-01-01T00:00:00.00Z" ) );

        return application;
    }

    private ApplicationDescriptor createApplicationDescriptor()
    {
        return createApplicationDescriptor( null );
    }

    private ApplicationDescriptor createApplicationDescriptor( final Icon icon )
    {
        return ApplicationDescriptor.create().
            key( ApplicationKey.from( "testapplication" ) ).
            description( "Application description" ).
            icon( icon ).
            build();
    }

    private CmsDescriptor createCmsDescriptor()
    {
        final Form config = Form.create().
            addFormItem( Input.create().name( "some-name" ).label( "some-label" ).helpTextI18nKey( "site.config.helpText" ).labelI18nKey(
                "site.config.label" ).inputType( InputTypeName.TEXT_LINE ).build() ).
            build();

        return CmsDescriptor.create().applicationKey( ApplicationKey.from( "testapplication" ) ).form( config ).build();
    }

    private IdProviderDescriptor createIdProviderDescriptor()
    {
        final Form config = Form.create().
            addFormItem( Input.create().name( "some-name" ).label( "some-label" ).labelI18nKey( "key.label" ).helpTextI18nKey(
                "key.help-text" ).inputType( InputTypeName.TEXT_LINE ).build() ).
            build();
        return IdProviderDescriptor.create().
            config( config ).
            build();
    }

    @Override
    protected Object getResourceInstance()
    {
        this.applicationService = mock( ApplicationService.class );
        this.applicationDescriptorService = mock( ApplicationDescriptorService.class );
        this.cmsService = mock( CmsService.class );
        this.idProviderDescriptorService = mock( IdProviderDescriptorService.class );
        this.localeService = mock( LocaleService.class );
        this.formFragmentService = mock( CmsFormFragmentService.class );

        final ApplicationResource resource = new ApplicationResource();
        resource.setApplicationService( this.applicationService );
        resource.setCmsService( this.cmsService );
        resource.setIdProviderDescriptorService( this.idProviderDescriptorService );
        resource.setApplicationDescriptorService( this.applicationDescriptorService );
        resource.setLocaleService( this.localeService );
        resource.setFormFragmentService( this.formFragmentService );

        return resource;
    }
}
