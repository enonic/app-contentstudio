package com.enonic.xp.app.contentstudio.rest.resource.schema.content;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import javax.imageio.ImageIO;

import org.jboss.resteasy.core.ResteasyContext;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.mockito.AdditionalAnswers;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

import com.enonic.xp.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.xp.form.FieldSet;
import com.enonic.xp.form.Form;
import com.enonic.xp.form.FormItemSet;
import com.enonic.xp.form.FormOptionSet;
import com.enonic.xp.form.FormOptionSetOption;
import com.enonic.xp.form.InlineMixin;
import com.enonic.xp.form.Input;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.icon.Icon;
import com.enonic.xp.inputtype.InputTypeName;
import com.enonic.xp.schema.content.ContentType;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeNames;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.schema.content.ContentTypes;
import com.enonic.xp.schema.content.GetContentTypeParams;
import com.enonic.xp.schema.mixin.MixinService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

public class ContentTypeResourceTest
    extends AdminResourceTestSupport
{
    private static final Instant SOME_DATE = LocalDateTime.of( 2013, 1, 1, 12, 0, 0 ).toInstant( ZoneOffset.UTC );

    private static final ContentTypeName MY_CTY_QUALIFIED_NAME = ContentTypeName.from( "myapplication:my_cty" );

    private ContentTypeService contentTypeService;

    private LocaleService localeService;

    private MixinService mixinService;

    private ContentTypeResource resource;

    public ContentTypeResourceTest()
    {
        super();
    }

    @Override
    protected Object getResourceInstance()
    {
        this.resource = new ContentTypeResource();
        contentTypeService = mock( ContentTypeService.class );
        localeService = mock( LocaleService.class );
        mixinService = mock( MixinService.class );

        this.resource.setContentTypeService( contentTypeService );
        this.resource.setLocaleService( localeService );
        this.resource.setMixinService( mixinService );

        final HttpServletRequest mockRequest = mock( HttpServletRequest.class );
        when( mockRequest.getServerName() ).thenReturn( "localhost" );
        when( mockRequest.getScheme() ).thenReturn( "http" );
        when( mockRequest.getServerPort() ).thenReturn( 80 );
        when( mockRequest.getLocales() ).thenReturn( Collections.enumeration( Collections.singleton( Locale.US ) ) );
        ResteasyContext.getContextDataMap().put( HttpServletRequest.class, mockRequest );

        return this.resource;
    }

    @Test
    public void get_contentType_with_only_one_input()
        throws Exception
    {
        // setup
        final ContentType contentType = ContentType.create().
            name( MY_CTY_QUALIFIED_NAME ).
            createdTime( SOME_DATE ).
            superType( ContentTypeName.unstructured() ).
            displayName( "My ContentType" ).
            description( "My description" ).
            icon( Icon.from( new byte[]{123}, "image/gif", SOME_DATE ) ).
            addFormItem( Input.create().
                name( "myTextLine" ).
                inputType( InputTypeName.TEXT_LINE ).
                label( "My text line" ).
                required( true ).
                build() ).
            build();

        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) ).thenReturn( contentType );
        when( mixinService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        // execute
        String jsonString = request().path( "schema/content" )
            .queryParam( "name", MY_CTY_QUALIFIED_NAME.toString() )
            .queryParam( "inlineMixinsToFormItems", "false" )
            .get()
            .getAsString();

        // verify
        assertJson( "ContentTypeResourceTest-get_contentType_with_only_one_input-result.json", jsonString );
    }

    @Test
    public void get_contentType_i18n_fieldSet()
        throws Exception
    {
        final ContentType contentType = ContentType.create().
            name( MY_CTY_QUALIFIED_NAME ).
            createdTime( SOME_DATE ).
            superType( ContentTypeName.unstructured() ).
            displayName( "My ContentType" ).
            description( "My description" ).
            icon( Icon.from( new byte[]{123}, "image/gif", SOME_DATE ) ).
            addFormItem( FieldSet.create().

                label( "My field set" ).
                labelI18nKey( "key.label" ).
                addFormItem( Input.create().
                    name( "myTextLine" ).
                    inputType( InputTypeName.TEXT_LINE ).
                    label( "My text line" ).
                    labelI18nKey( "key.label" ).
                    helpTextI18nKey( "key.help-text" ).
                    required( true ).
                    build() ).
                build() ).
            build();

        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) ).thenReturn( contentType );

        final MessageBundle messageBundle = mock( MessageBundle.class );
        when( messageBundle.localize( "key.label" ) ).thenReturn( "translated.label" );
        when( messageBundle.localize( "key.help-text" ) ).thenReturn( "translated.helpText" );

        when( this.localeService.getBundle( any(), any() ) ).thenReturn( messageBundle );
        when( mixinService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        // execute
        String jsonString = request().path( "schema/content" )
            .queryParam( "name", MY_CTY_QUALIFIED_NAME.toString() )
            .queryParam( "inlineMixinsToFormItems", "false" )
            .get()
            .getAsString();

        // verify
        assertJson( "ContentTypeResourceTest-get_contentType_i18n_fieldSet.json", jsonString );
    }

    @Test
    public void get_contentType_i18n_itemSet()
        throws Exception
    {
        final ContentType contentType = ContentType.create().
            name( MY_CTY_QUALIFIED_NAME ).
            createdTime( SOME_DATE ).
            superType( ContentTypeName.unstructured() ).
            displayName( "My ContentType" ).
            description( "My description" ).
            icon( Icon.from( new byte[]{123}, "image/gif", SOME_DATE ) ).
            addFormItem( FormItemSet.create().
                name( "myFormItemSet" ).
                label( "My Form Item Set" ).
                labelI18nKey( "key.label" ).
                addFormItem( Input.create().
                    name( "myTextLine" ).
                    inputType( InputTypeName.TEXT_LINE ).
                    label( "My text line" ).
                    labelI18nKey( "key.label" ).
                    helpTextI18nKey( "key.help-text" ).
                    required( true ).
                    build() ).
                build() ).
            build();

        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) ).thenReturn( contentType );

        final MessageBundle messageBundle = mock( MessageBundle.class );
        when( messageBundle.localize( "key.label" ) ).thenReturn( "translated.label" );
        when( messageBundle.localize( "key.help-text" ) ).thenReturn( "translated.helpText" );

        when( this.localeService.getBundle( any(), any() ) ).thenReturn( messageBundle );
        when( mixinService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        // execute
        String jsonString = request().path( "schema/content" )
            .queryParam( "name", MY_CTY_QUALIFIED_NAME.toString() )
            .queryParam( "inlineMixinsToFormItems", "false" )
            .get()
            .getAsString();

        // verify
        assertJson( "ContentTypeResourceTest-get_contentType_i18n_itemSet.json", jsonString );
    }

    @Test
    public void get_contentType_i18n_optionSet()
        throws Exception
    {
        final ContentType contentType = ContentType.create().
            name( MY_CTY_QUALIFIED_NAME ).
            createdTime( SOME_DATE ).
            superType( ContentTypeName.unstructured() ).
            displayName( "My ContentType" ).
            description( "My description" ).
            icon( Icon.from( new byte[]{123}, "image/gif", SOME_DATE ) ).
            addFormItem( FormOptionSet.create().
                name( "myOptionSet" ).
                label( "My Option Set" ).
                labelI18nKey( "key.label" ).
                helpTextI18nKey( "key.help-text" ).
                addOptionSetOption( FormOptionSetOption.create().
                    name( "option" ).
                    label( "My option" ).
                    helpText( "Option help text" ).
                    labelI18nKey( "key.label" ).
                    helpTextI18nKey( "key.help-text" ).
                    addFormItem( Input.create().
                        name( "myTextLine" ).
                        inputType( InputTypeName.TEXT_LINE ).
                        label( "My text line" ).
                        labelI18nKey( "key.label" ).
                        helpTextI18nKey( "key.help-text" ).
                        required( true ).
                        build() ).
                    build() ).
                build() ).
            build();

        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) ).thenReturn( contentType );

        final MessageBundle messageBundle = mock( MessageBundle.class );
        when( messageBundle.localize( "key.label" ) ).thenReturn( "translated.label" );
        when( messageBundle.localize( "key.help-text" ) ).thenReturn( "translated.helpText" );

        when( this.localeService.getBundle( any(), any() ) ).thenReturn( messageBundle );
        when( mixinService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        // execute
        String jsonString = request().path( "schema/content" )
            .queryParam( "name", MY_CTY_QUALIFIED_NAME.toString() )
            .queryParam( "inlineMixinsToFormItems", "false" )
            .get()
            .getAsString();

        // verify
        assertJson( "ContentTypeResourceTest-get_contentType_i18n_optionSet.json", jsonString );
    }

    @Test
    public void get_contentType_i18n()
        throws Exception
    {
        // setup
        final ContentType contentType = ContentType.create().
            name( MY_CTY_QUALIFIED_NAME ).
            createdTime( SOME_DATE ).
            superType( ContentTypeName.unstructured() ).
            displayName( "My ContentType" ).
            displayNameI18nKey( "key.display-name" ).
            description( "My description" ).
            descriptionI18nKey( "key.description" ).
            displayNameLabel( "My Display Name Label" ).
            displayNameLabelI18nKey( "key.displayNameLabel" ).
            icon( Icon.from( new byte[]{123}, "image/gif", SOME_DATE ) ).
            addFormItem( Input.create().
                name( "myTextLine" ).
                inputType( InputTypeName.TEXT_LINE ).
                label( "My text line" ).
                labelI18nKey( "key.label" ).
                helpTextI18nKey( "key.help-text" ).
                required( true ).
                build() ).
            build();

        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) ).thenReturn( contentType );

        final MessageBundle messageBundle = mock( MessageBundle.class );
        when( messageBundle.localize( "key.label" ) ).thenReturn( "translated.label" );
        when( messageBundle.localize( "key.help-text" ) ).thenReturn( "translated.helpText" );
        when( messageBundle.localize( "key.display-name" ) ).thenReturn( "translated.displayName" );
        when( messageBundle.localize( "key.description" ) ).thenReturn( "translated.description" );
        when( messageBundle.localize( "key.displayNameLabel" ) ).thenReturn( "translated.displayNameLabel" );

        when( this.localeService.getBundle( any(), any() ) ).thenReturn( messageBundle );
        when( mixinService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        // execute
        String jsonString = request().path( "schema/content" )
            .queryParam( "name", MY_CTY_QUALIFIED_NAME.toString() )
            .queryParam( "inlineMixinsToFormItems", "false" )
            .get()
            .getAsString();

        // verify
        assertJson( "ContentTypeResourceTest-get_contentType_i18n.json", jsonString );
    }

    @Test
    public void get_contentType_with_all_formItem_types()
        throws Exception
    {
        // setup

        Input myTextLine = Input.create().
            name( "myTextLine" ).
            inputType( InputTypeName.TEXT_LINE ).
            label( "My text line" ).
            required( true ).
            build();

        Input myCustomInput = Input.create().
            name( "myCheckbox" ).
            inputType( InputTypeName.CHECK_BOX ).
            label( "My checkbox input" ).
            required( false ).
            build();

        FieldSet myFieldSet = FieldSet.create().
            label( "My field set" ).
            addFormItem( Input.create().
                name( "myTextLine2" ).
                inputType( InputTypeName.TEXT_LINE ).
                label( "My text line" ).
                required( false ).
                build() ).
            build();

        FormItemSet myFormItemSet = FormItemSet.create().
            name( "myFormItemSet" ).
            label( "My form item set" ).
            addFormItem( Input.create().
                name( "myTextLine" ).
                inputType( InputTypeName.TEXT_LINE ).
                label( "My text line" ).
                required( false ).
                build() ).
            build();

        final FormOptionSet formOptionSet = FormOptionSet.create().
            name( "myOptionSet" ).
            label( "My option set" ).
            helpText( "Option set help text" ).
            addOptionSetOption(
                FormOptionSetOption.create()
                    .name( "myOptionSetOption1" )
                    .label( "option label1" )
                    .helpText( "Option help text" )
                    .
                        addFormItem(
                            Input.create().name( "myTextLine1" ).label( "myTextLine1" ).inputType( InputTypeName.TEXT_LINE ).build() )
                    .build() ).
            addOptionSetOption(
                FormOptionSetOption.create()
                    .name( "myOptionSetOption2" )
                    .label( "option label2" )
                    .helpText( "Option help text" )
                    .
                        addFormItem(
                            Input.create().name( "myTextLine2" ).label( "myTextLine2" ).inputType( InputTypeName.TEXT_LINE ).build() )
                    .build() ).
            build();

        InlineMixin myInline = InlineMixin.create().
            mixin( "myapplication:mymixin" ).
            build();

        ContentType contentType = ContentType.create().
            createdTime( SOME_DATE ).
            name( MY_CTY_QUALIFIED_NAME ).
            icon( Icon.from( new byte[]{123}, "image/gif", SOME_DATE ) ).
            superType( ContentTypeName.unstructured() ).
            addFormItem( myTextLine ).
            addFormItem( myCustomInput ).
            addFormItem( myFieldSet ).
            addFormItem( myFormItemSet ).
            addFormItem( myInline ).
            addFormItem( formOptionSet ).
            build();

        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) ).thenReturn( contentType );
        when( mixinService.inlineFormItems( isA( Form.class ) ) ).then( AdditionalAnswers.returnsFirstArg() );

        // execute
        String jsonString = request().path( "schema/content" )
            .queryParam( "name", MY_CTY_QUALIFIED_NAME.toString() )
            .queryParam( "inlineMixinsToFormItems", "false" )
            .get()
            .getAsString();

        // verify
        assertJson( "ContentTypeResourceTest-get_contentType_with_all_formItem_types-result.json", jsonString );
    }

    @Test
    public void list_one_contentType_with_only_one_input()
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

        when( contentTypeService.getAll() ).thenReturn( ContentTypes.from( contentType ) );

        // execute
        String jsonString = request().
            path( "schema/content/all" ).
            get().getAsString();

        // verify
        assertJson( "ContentTypeResourceTest-list_one_contentType_with_only_one_input-result.json", jsonString );
    }

    @Test
    public void testContentTypeIcon()
        throws Exception
    {
        final byte[] data;
        try (InputStream stream = getClass().getResourceAsStream( "contenttypeicon.png" ))
        {
            data = stream.readAllBytes();
        }
        Icon schemaIcon = Icon.from( data, "image/png", Instant.now() );

        final ContentType contentType = ContentType.create().
            name( "myapplication:my_content_type" ).
            displayName( "My content type" ).superType( ContentTypeName.from( "myapplication:unstructured" ) ).icon( schemaIcon ).build();
        setupContentType( contentType );

        // exercise
        final Response response = this.resource.getIcon( "myapplication:my_content_type", 20, null );
        final byte[] iconData = (byte[]) response.getEntity();

        // verify
        assertNotNull( iconData );
        final BufferedImage image = ImageIO.read( new ByteArrayInputStream( iconData ) );
        assertEquals( 20, image.getWidth() );
    }

    @Test
    public void testContentTypeIconSvg()
        throws Exception
    {
        final byte[] data;
        try (InputStream stream = getClass().getResourceAsStream( "archive.svg" ))
        {
            data = stream.readAllBytes();
        }
        Icon schemaIcon = Icon.from( data, "image/svg+xml", Instant.now() );

        final ContentType contentType = ContentType.create().
            name( "myapplication:icon_svg_test" ).
            displayName( "My content type" ).
            superType( ContentTypeName.from( "myapplication:unstructured" ) ).
            icon( schemaIcon ).
            build();
        setupContentType( contentType );

        // exercise
        final Response response = this.resource.getIcon( "myapplication:icon_svg_test", 20, "fed8beb6054fd1eed2916e4c1f43109c" );

        assertNotNull( response.getEntity() );
        assertEquals( schemaIcon.getMimeType(), response.getMediaType().toString() );
        Assertions.assertArrayEquals( data, (byte[]) response.getEntity() );
    }

    @Disabled
    @Test
    public void testContentTypeIcon_fromSuperType()
        throws Exception
    {
        final byte[] data;
        try (InputStream stream = getClass().getResourceAsStream( "contenttypeicon.png" ))
        {
            data = stream.readAllBytes();
        }
        Icon schemaIcon = Icon.from( data, "image/png", Instant.now() );

        final ContentType systemContentType = ContentType.create().
            superType( ContentTypeName.structured() ).
            name( "myapplication:unstructured" ).
            displayName( "Unstructured" ).
            icon( schemaIcon ).
            build();
        setupContentType( systemContentType );

        final ContentType contentType = ContentType.create().
            name( "myapplication:my_content_type" ).displayName( "My content type" ).superType( systemContentType.getName() ).build();
        setupContentType( contentType );

        // exercise
        final Response response = this.resource.getIcon( "myapplication:my_content_type", 20, null );
        final byte[] iconData = (byte[]) response.getEntity();

        // verify
        assertNotNull( iconData );
        final BufferedImage image = ImageIO.read( new ByteArrayInputStream( iconData ) );
        assertEquals( 20, image.getWidth() );
    }

    @Test
    public void testContentTypeIcon_notFound()
        throws Exception
    {
        when( contentTypeService.getByName( isA( GetContentTypeParams.class ) ) ).thenReturn( null );

        assertThrows( WebApplicationException.class, () -> {
            try
            {
                // exercise
                this.resource.getIcon( "myapplication:my_content_type", 10, null );
            }
            catch ( WebApplicationException e )
            {
                // verify
                assertEquals( 404, e.getResponse().getStatus() ); // HTTP Not Found
                throw e;
            }
        } );
    }

    @Test
    public void getMimeTypes()
    {
        final Set<String> mimeTypes = new HashSet<>();
        mimeTypes.add( "mimeType1" );
        mimeTypes.add( "mimeType2" );

        final ContentTypeNames contentTypeNames = ContentTypeNames.from( ContentTypeName.documentMedia(), ContentTypeName.audioMedia() );

        when( contentTypeService.getMimeTypes( contentTypeNames ) ).thenReturn( mimeTypes );

        final Collection<String> result =
            this.resource.getMimeTypes( ContentTypeName.documentMedia().toString() + "," + ContentTypeName.audioMedia().toString() );

        assertEquals( mimeTypes.size(), result.size() );
        assertTrue( result.contains( "mimeType1" ) );
        assertTrue( result.contains( "mimeType2" ) );
    }

    private void setupContentType( final ContentType contentType )
    {
        final List<ContentType> list = new ArrayList<>();
        list.add( contentType );
        when( contentTypeService.getByName( any(GetContentTypeParams.class) ) ).thenReturn( contentType );
    }
}
