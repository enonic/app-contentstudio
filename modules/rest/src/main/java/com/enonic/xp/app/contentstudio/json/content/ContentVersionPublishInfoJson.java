package com.enonic.xp.app.contentstudio.json.content;

import java.time.Instant;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.versions.ContentVersionPublishInfo;
import com.enonic.xp.security.Principal;

public class ContentVersionPublishInfoJson
{
    private final String publisher;

    private final Instant timestamp;

    private final String message;

    private final String publisherDisplayName;

    private final String type;

    private final ContentPublishInfoJson contentPublishInfo;

    public ContentVersionPublishInfoJson( final ContentVersionPublishInfo versionPublishInfo,
                                          final ContentPrincipalsResolver principalsResolver )
    {
        this.timestamp = versionPublishInfo.getTimestamp();
        this.message = versionPublishInfo.getMessage();

        final Principal publisher = principalsResolver.findPrincipal( versionPublishInfo.getPublisher() );

        this.publisher = versionPublishInfo.getPublisher().toString();
        this.publisherDisplayName = publisher != null ? publisher.getDisplayName() : "";
        this.type = versionPublishInfo.getType() != null ? versionPublishInfo.getType().toString() : null;

        this.contentPublishInfo = versionPublishInfo.getContentPublishInfo() != null
            ? new ContentPublishInfoJson( versionPublishInfo.getContentPublishInfo() )
            : null;
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
