package com.enonic.app.contentstudio.json.content;

import java.time.Instant;


import com.enonic.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.security.Principal;
import com.enonic.xp.security.PrincipalKey;

public class ContentVersionPublishInfoJson
{
    private final String publisher;

    private final Instant timestamp;

    private final String message;

    private final String publisherDisplayName;

    private final String type;

    private final ContentPublishInfoJson contentPublishInfo;

    public ContentVersionPublishInfoJson( final PrincipalKey publisher, final Instant timestamp, final String message, final String type,
                                          final ContentPublishInfoJson contentPublishInfo,
                                          final ContentPrincipalsResolver principalsResolver )
    {
        this.publisher = publisher.toString();
        this.timestamp = timestamp;
        this.message = message;

        final Principal principal = principalsResolver.findPrincipal( publisher );
        this.publisherDisplayName = principal != null ? principal.getDisplayName() : "";
        this.type = type;
        this.contentPublishInfo = contentPublishInfo;
    }

    public String getPublisher()
    {
        return publisher;
    }

    public Instant getTimestamp()
    {
        return timestamp;
    }

    public String getMessage()
    {
        return message;
    }

    public String getPublisherDisplayName()
    {
        return publisherDisplayName;
    }

    public String getType()
    {
        return type;
    }

    public ContentPublishInfoJson getContentPublishInfo()
    {
        return contentPublishInfo;
    }
}
