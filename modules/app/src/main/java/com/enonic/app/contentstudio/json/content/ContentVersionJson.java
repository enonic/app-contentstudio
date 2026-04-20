package com.enonic.app.contentstudio.json.content;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import com.enonic.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.app.contentstudio.rest.resource.content.ContentPublishInfoResolver;
import com.enonic.xp.content.ContentVersion;
import com.enonic.xp.content.ContentVersionId;
import com.enonic.xp.security.Principal;
import com.enonic.xp.security.PrincipalKey;

public class ContentVersionJson
{
    private final Instant timestamp;

    private final String comment;

    private final String id;

    private final ContentPublishInfoJson publishInfo;

    private final String contentPath;

    private final List<ActionJson> changes;

    public ContentVersionJson( final ContentVersion version, final Set<ContentVersionId> batchVersionIds,
                               final ContentPrincipalsResolver principalsResolver,
                               final ContentPublishInfoResolver contentPublishInfoResolver )
    {
        this.timestamp = version.timestamp();
        this.comment = version.comment();
        this.contentPath = version.path().toString();
        this.id = version.versionId().toString();
        this.publishInfo = version.actions()
            .stream()
            .filter( c -> c.operation().equals( ContentVersionHelper.PUBLISH_KEY ) )
            .findFirst()
            .map( c -> new ContentPublishInfoJson(
                contentPublishInfoResolver.resolvePublishInfo( version.contentId(), version.versionId() ) ) )
            .orElse( null );

        this.changes = version.actions()
            .stream()
            .map( c -> new ActionJson( c.operation(), c.fields(), c.editorial() != null ? c.editorial().toString() : null,
                                       resolveEditorialExists( version, c, batchVersionIds, contentPublishInfoResolver ),
                                       c.user().toString(), resolveUserDisplayName( c.user(), principalsResolver ), c.opTime() ) )
            .toList();
    }

    private boolean resolveEditorialExists( final ContentVersion version, final ContentVersion.Action action,
                                            final Set<ContentVersionId> batchVersionIds,
                                            final ContentPublishInfoResolver contentPublishInfoResolver )
    {
        if ( !ContentVersionHelper.PUBLISH_KEY.equals( action.operation() ) || action.editorial() == null )
        {
            return false;
        }

        if ( batchVersionIds.contains( action.editorial() ) )
        {
            return true;
        }

        return contentPublishInfoResolver.versionExists( version.contentId(), action.editorial() );
    }

    private String resolveUserDisplayName( final PrincipalKey key, final ContentPrincipalsResolver principalsResolver )
    {
        final Principal principal = principalsResolver.findPrincipal( key );
        return principal != null ? principal.getDisplayName() : "";
    }

    @SuppressWarnings("UnusedDeclaration")
    public Instant getTimestamp()
    {
        return timestamp;
    }

    @SuppressWarnings("UnusedDeclaration")
    public String getComment()
    {
        return comment;
    }

    @SuppressWarnings("UnusedDeclaration")
    public String getId()
    {
        return id;
    }

    @SuppressWarnings("UnusedDeclaration")
    public ContentPublishInfoJson getPublishInfo()
    {
        return publishInfo;
    }

    public String getPath()
    {
        return contentPath;
    }

    public List<ActionJson> getActions()
    {
        return changes;
    }
}
