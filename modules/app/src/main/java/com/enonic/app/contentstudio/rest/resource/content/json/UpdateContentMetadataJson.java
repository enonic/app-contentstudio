package com.enonic.app.contentstudio.rest.resource.content.json;

import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.UpdateContentMetadataParams;
import com.enonic.xp.security.PrincipalKey;

import static com.google.common.base.Strings.isNullOrEmpty;

public final class UpdateContentMetadataJson
{
    private final UpdateContentMetadataParams updateContentMetadataParams;

    @JsonCreator
    UpdateContentMetadataJson( @JsonProperty("contentId") final String contentId, @JsonProperty("owner") final String owner,
                               @JsonProperty("language") final String language )
    {
        this.updateContentMetadataParams = UpdateContentMetadataParams.create()
            .contentId( ContentId.from( contentId ) )
            .editor( edit -> {
                edit.owner = isNullOrEmpty( owner ) ? null : PrincipalKey.from( owner );
                edit.language = isNullOrEmpty( language ) ? null : Locale.forLanguageTag( language );
            } )
            .build();
    }

    @JsonIgnore
    public UpdateContentMetadataParams getUpdateContentMetadataParams()
    {
        return updateContentMetadataParams;
    }
}
