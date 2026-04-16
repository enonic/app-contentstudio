package com.enonic.app.contentstudio.json.content;

import org.junit.jupiter.api.Test;

import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.content.ValidationError;
import com.enonic.xp.content.ValidationErrorCode;
import com.enonic.xp.data.PropertyPath;
import com.enonic.xp.region.ComponentPath;
import com.enonic.xp.schema.mixin.MixinName;
import com.enonic.xp.util.BinaryReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;

class ValidationErrorJsonTest
{
    @Test
    void dataValidationError()
    {
        final ValidationError error =
            ValidationError.dataError( ValidationErrorCode.parse( "app:code" ), PropertyPath.from( "a.b" ) ).build();
        final LocaleMessageResolver messageResolver = mock( LocaleMessageResolver.class );
        final ValidationErrorJson validationErrorJson = new ValidationErrorJson( error, messageResolver );
        assertEquals( "app:code", validationErrorJson.getErrorCode() );
        assertEquals( "dataError", validationErrorJson.getType() );
        assertEquals( "a.b", validationErrorJson.getPropertyPath() );
        assertNull( validationErrorJson.getAttachment() );
        assertNull( validationErrorJson.getApplicationKey() );
        assertNull( validationErrorJson.getMixinName() );
        assertNull( validationErrorJson.getComponentPath() );
    }

    @Test
    void attachmentValidationError()
    {
        final ValidationError error =
            ValidationError.attachmentError( ValidationErrorCode.parse( "app:code" ), BinaryReference.from( "a.b" ) ).build();
        final LocaleMessageResolver messageResolver = mock( LocaleMessageResolver.class );
        final ValidationErrorJson validationErrorJson = new ValidationErrorJson( error, messageResolver );
        assertEquals( "app:code", validationErrorJson.getErrorCode() );
        assertEquals( "attachmentError", validationErrorJson.getType() );
        assertEquals( "a.b", validationErrorJson.getAttachment() );
        assertNull( validationErrorJson.getPropertyPath() );
        assertNull( validationErrorJson.getApplicationKey() );
        assertNull( validationErrorJson.getMixinName() );
        assertNull( validationErrorJson.getComponentPath() );
    }

    @Test
    void generalValidationError()
    {
        final ValidationError error = ValidationError.generalError( ValidationErrorCode.parse( "app:code" ) )
            .message( "message" )
            .i18n( "some.code" ).args( "a", 1 )
            .build();
        final LocaleMessageResolver messageResolver = mock( LocaleMessageResolver.class );
        final ValidationErrorJson validationErrorJson = new ValidationErrorJson( error, messageResolver );
        assertEquals( "app:code", validationErrorJson.getErrorCode() );
        assertEquals( "generalError", validationErrorJson.getType() );
        assertNull( validationErrorJson.getPropertyPath() );
        assertNull( validationErrorJson.getAttachment() );
        assertNull( validationErrorJson.getApplicationKey() );
        assertNull( validationErrorJson.getMixinName() );
        assertNull( validationErrorJson.getComponentPath() );
    }

    @Test
    void siteConfigValidationError()
    {
        final ValidationError error =
            ValidationError.siteConfigError( ValidationErrorCode.parse( "app:code" ), PropertyPath.from( "x.y" ),
                                             ApplicationKey.from( "com.enonic.myapp" ) ).build();
        final LocaleMessageResolver messageResolver = mock( LocaleMessageResolver.class );
        final ValidationErrorJson validationErrorJson = new ValidationErrorJson( error, messageResolver );
        assertEquals( "app:code", validationErrorJson.getErrorCode() );
        assertEquals( "siteConfigError", validationErrorJson.getType() );
        assertEquals( "x.y", validationErrorJson.getPropertyPath() );
        assertEquals( "com.enonic.myapp", validationErrorJson.getApplicationKey() );
        assertNull( validationErrorJson.getAttachment() );
        assertNull( validationErrorJson.getMixinName() );
        assertNull( validationErrorJson.getComponentPath() );
    }

    @Test
    void mixinConfigValidationError()
    {
        final ValidationError error =
            ValidationError.mixinConfigError( ValidationErrorCode.parse( "app:code" ), PropertyPath.from( "m.n" ),
                                              MixinName.from( "com.enonic.myapp:myMixin" ) ).build();
        final LocaleMessageResolver messageResolver = mock( LocaleMessageResolver.class );
        final ValidationErrorJson validationErrorJson = new ValidationErrorJson( error, messageResolver );
        assertEquals( "app:code", validationErrorJson.getErrorCode() );
        assertEquals( "mixinConfigError", validationErrorJson.getType() );
        assertEquals( "m.n", validationErrorJson.getPropertyPath() );
        assertEquals( "com.enonic.myapp:myMixin", validationErrorJson.getMixinName() );
        assertNull( validationErrorJson.getAttachment() );
        assertNull( validationErrorJson.getApplicationKey() );
        assertNull( validationErrorJson.getComponentPath() );
    }

    @Test
    void componentConfigValidationError()
    {
        final ValidationError error =
            ValidationError.componentConfigError( ValidationErrorCode.parse( "app:code" ), PropertyPath.from( "c.d" ),
                                                  ApplicationKey.from( "com.enonic.myapp" ),
                                                  ComponentPath.from( "main/0" ) ).build();
        final LocaleMessageResolver messageResolver = mock( LocaleMessageResolver.class );
        final ValidationErrorJson validationErrorJson = new ValidationErrorJson( error, messageResolver );
        assertEquals( "app:code", validationErrorJson.getErrorCode() );
        assertEquals( "componentConfigError", validationErrorJson.getType() );
        assertEquals( "c.d", validationErrorJson.getPropertyPath() );
        assertEquals( "com.enonic.myapp", validationErrorJson.getApplicationKey() );
        assertEquals( "/main/0", validationErrorJson.getComponentPath() );
        assertNull( validationErrorJson.getAttachment() );
        assertNull( validationErrorJson.getMixinName() );
    }
}
