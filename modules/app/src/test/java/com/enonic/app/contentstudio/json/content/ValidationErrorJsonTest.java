package com.enonic.app.contentstudio.json.content;

import org.junit.jupiter.api.Test;

import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.content.ValidationError;
import com.enonic.xp.content.ValidationErrorCode;
import com.enonic.xp.data.PropertyPath;
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
        assertEquals( "a.b", validationErrorJson.getPropertyPath() );
        assertNull( validationErrorJson.getAttachment() );
    }

    @Test
    void attachmentValidationError()
    {
        final ValidationError error =
            ValidationError.attachmentError( ValidationErrorCode.parse( "app:code" ), BinaryReference.from( "a.b" ) ).build();
        final LocaleMessageResolver messageResolver = mock( LocaleMessageResolver.class );
        final ValidationErrorJson validationErrorJson = new ValidationErrorJson( error, messageResolver );
        assertEquals( "app:code", validationErrorJson.getErrorCode() );
        assertEquals( "a.b", validationErrorJson.getAttachment() );
        assertNull( validationErrorJson.getPropertyPath() );
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
    }
}
