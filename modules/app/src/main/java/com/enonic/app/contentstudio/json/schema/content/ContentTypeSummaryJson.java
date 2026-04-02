package com.enonic.app.contentstudio.json.schema.content;

import java.time.Instant;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.app.contentstudio.json.ChangeTraceableJson;
import com.enonic.app.contentstudio.json.ItemJson;
import com.enonic.app.contentstudio.rest.resource.schema.content.ContentTypeIconUrlResolver;
import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.schema.content.ContentType;

import static com.google.common.base.Strings.nullToEmpty;

@SuppressWarnings("UnusedDeclaration")
public class ContentTypeSummaryJson
    implements ItemJson, ChangeTraceableJson
{
    private final ContentType contentType;

    private final String iconUrl;

    private final LocaleMessageResolver localeMessageResolver;

    public ContentTypeSummaryJson( final ContentType contentType, final ContentTypeIconUrlResolver iconUrlResolver,
                                   final LocaleMessageResolver localeMessageResolver, final HttpServletRequest request )
    {
        this.contentType = contentType;
        this.localeMessageResolver = localeMessageResolver;
        this.iconUrl = iconUrlResolver.resolve( contentType );
    }

    public String getName()
    {
        return contentType.getName() != null ? contentType.getName().toString() : null;
    }

    public String getTitle()
    {
        if ( !nullToEmpty( contentType.getTitleI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( contentType.getTitleI18nKey(), contentType.getTitle() );
        }
        else
        {
            return contentType.getTitle();
        }
    }

    public String getDescription()
    {
        if ( !nullToEmpty( contentType.getDescriptionI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( contentType.getDescriptionI18nKey(), contentType.getDescription() );
        }
        else
        {
            return contentType.getDescription();
        }
    }

    public String getDisplayNamePlaceholder()
    {
        if ( !nullToEmpty( contentType.getDisplayNamePlaceholderI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( contentType.getDisplayNamePlaceholderI18nKey(),
                                                          contentType.getDisplayNamePlaceholder() );
        }
        else
        {
            return contentType.getDisplayNamePlaceholder();
        }
    }

    @Override
    public Instant getCreatedTime()
    {
        return contentType.getCreatedTime();
    }

    @Override
    public Instant getModifiedTime()
    {
        return contentType.getModifiedTime();
    }

    public String getIconUrl()
    {
        return iconUrl;
    }

    public String getDisplayNameExpression()
    {
        return contentType.getDisplayNameExpression();
    }

    public String getSuperType()
    {
        return contentType.getSuperType() != null ? contentType.getSuperType().toString() : null;
    }

    public boolean isAbstract()
    {
        return contentType.isAbstract();
    }

    public boolean isFinal()
    {
        return contentType.isFinal();
    }

    public boolean isAllowChildContent()
    {
        return contentType.allowChildContent();
    }

    public List<String> getAllowChildContentType()
    {
        return this.contentType.getAllowChildContentType();
    }

    @Override
    public String getCreator()
    {
        return contentType.getCreator() != null ? contentType.getCreator().toString() : null;
    }

    @Override
    public String getModifier()
    {
        return contentType.getModifier() != null ? contentType.getModifier().toString() : null;
    }

    @Override
    public boolean getEditable()
    {
        return false;
    }

    @Override
    public boolean getDeletable()
    {
        return false;
    }
}
