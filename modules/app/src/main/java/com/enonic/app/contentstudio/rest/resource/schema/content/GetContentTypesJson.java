package com.enonic.app.contentstudio.rest.resource.schema.content;


import java.util.Set;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.content.ContentId;

public class GetContentTypesJson
{
    private final ContentId contentId;

    private final Set<String> allowedContentTypes;

    private final String applicationKey;

    @JsonCreator
    public GetContentTypesJson( @JsonProperty("contentId") String contentId,
                                @JsonProperty("allowedContentTypes") final Set<String> allowedContentTypes,
                                @JsonProperty("applicationKey") final String applicationKey )
    {
        this.contentId = contentId != null ? ContentId.from( contentId ) : null;
        this.allowedContentTypes = allowedContentTypes != null ? allowedContentTypes : Set.of();
        this.applicationKey = applicationKey;
    }

    public ContentId getContentId()
    {
        return contentId;
    }

    public Set<String> getAllowedContentTypes()
    {
        return allowedContentTypes;
    }

    /** The application the allowed content type patterns are resolved against when there is no parent content, unparsed. */
    public String getApplicationKey()
    {
        return applicationKey;
    }
}
