package com.enonic.xp.app.contentstudio.rest.resource.schema.content;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.Locale;

import org.jboss.resteasy.core.ResteasyContext;
import org.junit.jupiter.api.Test;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.form.Input;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.inputtype.InputTypeName;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.ContentTypes;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteConfigs;
import com.enonic.xp.site.SiteConfigsDataSerializer;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class ContentTypeContextResourceTest
    extends AdminResourceTestSupport
{
    private static final Instant SOME_DATE = LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).toInstant( ZoneOffset.UTC );

    private static final ContentTypeName MY_CTY_QUALIFIED_NAME = ContentTypeName.from( "myapplication:my_cty" );

    private ContentTypeService contentTypeService;

    private ContentService contentService;

    private LocaleService localeService;

    private ContentTypeContextResource resource;

    public ContentTypeContextResourceTest()
    {
        super();
    }

    @Override
    protected Object getResourceInstance()
    {
        this.resource = new ContentTypeContextResource();
        contentTypeService = mock( ContentTypeService.class );
        contentService = mock( ContentService.class );
        localeService = mock( LocaleService.class );

        this.resource.setContentTypeService( contentTypeService );
        this.resource.setLocaleService( localeService );
        this.resource.setContentService( contentService );

        final HttpServletRequest mockRequest = mock( HttpServletRequest.class );
        when( mockRequest.getServerName() ).thenReturn( "localhost" );
        when( mockRequest.getScheme() ).thenReturn( "http" );
        when( mockRequest.getServerPort() ).thenReturn( 80 );
        when( mockRequest.getLocales() ).thenReturn( Collections.enumeration( Collections.singleton( Locale.US ) ) );
        ResteasyContext.getContextDataMap().put( HttpServletRequest.class, mockRequest );

        return this.resource;
    }

    @Test
    public void getTypesByContentContext()
        throws Exception
    {
        // setup
        final ContentType contentType = ContentType.create().
            createdTime( SOME_DATE ).
            name( MY_CTY_QUALIFIED_NAME ).
            icon( Icon.from( new byte[]{123}, "image/gif", SOME_DATE ) ).
            superType( ContentTypeName.unstructured() ).
            addFormItem( Input.create().
                name( "myTextLine" ).
                inputType( InputTypeName.TEXT_LINE ).
                label( "My text line" ).
                required( true ).
                build() ).
            build();

        when( contentTypeService.getByApplication( isA( ApplicationKey.class ) ) ).thenReturn( ContentTypes.from( contentType ) );
        final Site site = newSite();
        when( contentService.getNearestSite( eq( ContentId.from( "1004242" ) ) ) ).thenReturn( site );

        // execute
        String jsonString = request().
            path( "cms/default/content/schema/content/byContent" ).
            queryParam( "contentId", "1004242" ).
            get().getAsString();

        // verify
        assertJson( "ContentTypeResourceTest-list_one_contentType_with_only_one_input-result.json", jsonString );
    }

    public static Site newSite()
    {
        final PropertyTree siteConfigConfig = new PropertyTree();
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
