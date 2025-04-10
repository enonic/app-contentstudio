package com.enonic.xp.app.contentstudio.json.content;

import java.util.Optional;

import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.content.AttachmentValidationError;
import com.enonic.xp.content.DataValidationError;
import com.enonic.xp.content.ValidationError;
import com.enonic.xp.content.ValidationErrorCode;

public class ValidationErrorJson
{
    private final String errorCode;

    private final String message;

    private final String propertyPath;

    private final String attachment;

    public ValidationErrorJson( final ValidationError validationError, final LocaleMessageResolver localeMessageResolver )
    {
        this.propertyPath = ( validationError instanceof DataValidationError )
            ? ( (DataValidationError) validationError ).getPropertyPath().toString()
            : null;
        this.attachment =
            ( validationError instanceof AttachmentValidationError ) ? ( (AttachmentValidationError) validationError ).getAttachment()
                .toString() : null;

        final ValidationErrorCode errorCode = validationError.getErrorCode();
        final String i18nKey = Optional.ofNullable( validationError.getI18n() ).orElse( validationError.getErrorCode().toString() );

        this.errorCode = errorCode.toString();

        final String localizeMessage =
            localeMessageResolver.localizeMessage( i18nKey, null, validationError.getArgs().toArray() );

        this.message = Optional.ofNullable( localizeMessage )
            .or( () -> Optional.ofNullable( validationError.getMessage() ) )
            .orElseGet( errorCode::toString );
    }

    public String getErrorCode()
    {
        return errorCode;
    }

    public String getMessage()
    {
        return message;
    }

    public String getPropertyPath()
    {
        return propertyPath;
    }

    public String getAttachment()
    {
        return attachment;
    }
}
