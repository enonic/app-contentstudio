package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.List;
import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.content.ContentIds;

import static com.google.common.base.Strings.isNullOrEmpty;

public class LocalizeContentsJson
{
    private final ContentIds contentIds;

    private final Locale language;

    @JsonCreator
    public LocalizeContentsJson( @JsonProperty("contentIds") final List<String> contentIds,
                                 @JsonProperty("language") final String language )
    {
        this.contentIds = ContentIds.from( contentIds );
        this.language = isNullOrEmpty( language ) ? null : Locale.forLanguageTag( language );
    }

    public ContentIds getContentIds()
    {
        return contentIds;
    }

    public Locale getLanguage()
    {
        return language;
    }
}
