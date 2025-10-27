package com.enonic.xp.app.contentstudio.json.content;

import java.time.Instant;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.versions.ContentVersionPublishInfo;
import com.enonic.xp.content.ContentPublishInfo;
import com.enonic.xp.content.ContentVersionCommitInfo;
import com.enonic.xp.security.Principal;

public class ContentVersionPublishInfoJson
{
    private final String publisher;

    private final Instant timestamp;

    private final String message;

    private final String publisherDisplayName;

    private final String type;

    private final ContentPublishInfoJson contentPublishInfo;

    public ContentVersionPublishInfoJson( final ContentPublishInfo publishInfo, final ContentVersionCommitInfo commitInfo,
                                          final ContentPrincipalsResolver principalsResolver )
    {
        this.timestamp = commitInfo == null ? null : commitInfo.getTimestamp();
        this.message = commitInfo == null ? null : commitInfo.getMessage();

        final Principal publisher = commitInfo == null ? null : principalsResolver.findPrincipal( commitInfo.getCommiter() );

        this.publisher = commitInfo == null ? null : commitInfo.getCommiter().toString();
        this.publisherDisplayName = publisher != null ? publisher.getDisplayName() : "";
        this.type = commitInfo == null ? null : ( commitInfo.getType() != null ? commitInfo.getType().toString() : null );

        this.contentPublishInfo = publishInfo != null ? new ContentPublishInfoJson( publishInfo ) : null;
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
