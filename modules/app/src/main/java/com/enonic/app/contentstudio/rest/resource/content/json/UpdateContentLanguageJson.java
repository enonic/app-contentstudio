package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.UpdateContentParams;

import static com.google.common.base.Strings.isNullOrEmpty;

public final class UpdateContentLanguageJson
{
    private final UpdateContentParams updateContentParams;

    @JsonCreator
    UpdateContentLanguageJson( @JsonProperty("contentId") final String contentId, @JsonProperty("language") final String language )
    {
        final Locale locale = isNullOrEmpty( language ) ? null : Locale.forLanguageTag( language );

        this.updateContentParams = new UpdateContentParams().contentId( ContentId.from( contentId ) ).editor( edit -> {
            edit.language = locale;
        } );
    }

    @JsonIgnore
    public UpdateContentParams getUpdateContentParams()
    {
        return updateContentParams;
    }
}
