package com.enonic.app.contentstudio.json.content;

import java.util.Optional;

import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.content.AttachmentValidationError;
import com.enonic.xp.content.ComponentConfigValidationError;
import com.enonic.xp.content.DataValidationError;
import com.enonic.xp.content.MixinConfigValidationError;
import com.enonic.xp.content.SiteConfigValidationError;
import com.enonic.xp.content.ValidationError;
import com.enonic.xp.content.ValidationErrorCode;

public class ValidationErrorJson
{
    private final String errorCode;

    private final String message;

    private final String propertyPath;

    private final String attachment;

    private final String applicationKey;

    private final String mixinName;

    private final String componentPath;

    private final String type;

    public ValidationErrorJson( final ValidationError validationError, final LocaleMessageResolver localeMessageResolver )
    {
        switch ( validationError )
        {
            case ComponentConfigValidationError e ->
            {
                this.type = "componentConfigError";
                this.propertyPath = e.getPropertyPath().toString();
                this.attachment = null;
                this.applicationKey = e.getApplicationKey().toString();
                this.mixinName = null;
                this.componentPath = e.getComponentPath().toString();
            }
            case SiteConfigValidationError e ->
            {
                this.type = "siteConfigError";
                this.propertyPath = e.getPropertyPath().toString();
                this.attachment = null;
                this.applicationKey = e.getApplicationKey().toString();
                this.mixinName = null;
                this.componentPath = null;
            }
            case MixinConfigValidationError e ->
            {
                this.type = "mixinConfigError";
                this.propertyPath = e.getPropertyPath().toString();
                this.attachment = null;
                this.applicationKey = null;
                this.mixinName = e.getMixinName().toString();
                this.componentPath = null;
            }
            case DataValidationError e ->
            {
                this.type = "dataError";
                this.propertyPath = e.getPropertyPath().toString();
                this.attachment = null;
                this.applicationKey = null;
                this.mixinName = null;
                this.componentPath = null;
            }
            case AttachmentValidationError e ->
            {
                this.type = "attachmentError";
                this.propertyPath = null;
                this.attachment = e.getAttachment().toString();
                this.applicationKey = null;
                this.mixinName = null;
                this.componentPath = null;
            }
            default ->
            {
                this.type = "generalError";
                this.propertyPath = null;
                this.attachment = null;
                this.applicationKey = null;
                this.mixinName = null;
                this.componentPath = null;
            }
        }

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

    public String getApplicationKey()
    {
        return applicationKey;
    }

    public String getMixinName()
    {
        return mixinName;
    }

    public String getComponentPath()
    {
        return componentPath;
    }

    public String getType()
    {
        return type;
    }
}
