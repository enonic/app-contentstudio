package com.enonic.xp.app.contentstudio.json.content;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPublishInfoResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ChildOrderJson;
import com.enonic.xp.content.ContentPublishInfo;
import com.enonic.xp.content.ContentVersion;
import com.enonic.xp.index.ChildOrder;
import com.enonic.xp.security.Principal;
import com.enonic.xp.security.PrincipalKey;

public class ContentVersionJson
{
    private final String modifier;

    private final String modifierDisplayName;

    private final Instant modified;

    private final Instant timestamp;

    private final String comment;

    private final String id;

    private final ContentVersionPublishInfoJson publishInfo;

    private final boolean permissionsChanged;

    private final String contentPath;

    private final List<ContentVersion.Change> changes;

    public ContentVersionJson( final ContentVersion contentVersion, final ContentPrincipalsResolver principalsResolver,
                               final ContentPublishInfoResolver contentPublishInfoResolver )
    {
        this.timestamp = contentVersion.getTimestamp();
        this.comment = contentVersion.getComment();
        this.contentPath = contentVersion.getPath().toString(); // TODO not essential
        this.id = contentVersion.getVersionId().toString();

        final Optional<ContentVersion.Change> modChange = contentVersion.getChanges()
            .reversed()
            .stream()
            .filter( c -> ContentVersionHelper.CHANGE_OPERATIONS.contains( c.operation() ) )
            .findFirst();

        if ( modChange.isPresent() )
        {
            final PrincipalKey changedBy = modChange.get().user();
            this.modifier = changedBy.toString();
            this.modifierDisplayName =
                Optional.ofNullable( principalsResolver.findPrincipal( changedBy ) ).map( Principal::getDisplayName ).orElse( "" );
            this.modified = modChange.get().opTime();
        }
        else
        {
            this.modifier = null;
            this.modifierDisplayName = "";
            this.modified = contentVersion.getTimestamp(); // TODO just to make old UI happy
        }

        // TODO just an example. In reality one version can have multiple attributes

        ContentVersionPublishInfoJson info = contentVersion.getChanges()
            .stream()
            .filter( c -> c.operation().equals( ContentVersionHelper.PUBLISH_KEY ) )
            .findFirst()
            .map( c -> {
                return new ContentVersionPublishInfoJson( c.user(), c.opTime(), contentVersion.getComment(), "PUBLISHED",
                                                          new ContentPublishInfoJson(
                                                              contentPublishInfoResolver.resolvePublishInfo( contentVersion.getContentId(),
                                                                                                             contentVersion.getVersionId() ) ),
                                                          principalsResolver );
            } ).orElse( null );

        // TODO This is just an example to make old UI work. unpublishing happens on the same version as publishing
        info = contentVersion.getChanges()
            .stream()
            .filter( c -> c.operation().equals( ContentVersionHelper.UNPUBLISH_KEY ) )
            .findFirst()
            .map( c -> {
                return new ContentVersionPublishInfoJson( c.user(), c.opTime(), contentVersion.getComment(), "UNPUBLISHED",
                                                          new ContentPublishInfoJson( ContentPublishInfo.create().build() ),
                                                          principalsResolver );
            } ).orElse(  info );

        if (info == null ) // TODO This is just an example to make old UI work. publishing may be done on unchanged version.
        {
            info = modChange
                .map( ( c -> {
                    final String commitType = switch ( c.operation() )
                    {
                        case "content.archive" -> "ARCHIVED";
                        case "content.restore" -> "RESTORED";
                        case null, default -> null;
                    };
                    return commitType == null
                        ? null
                        : new ContentVersionPublishInfoJson( c.user(), c.opTime(), contentVersion.getComment(),
                                                             commitType, null, principalsResolver );
                } )).orElse( null );
        }

        this.publishInfo = info;

        this.changes = contentVersion.getChanges();

        this.permissionsChanged = contentVersion.getChanges()
            .stream()
            .map( ContentVersion.Change::operation )
            .anyMatch( c -> c.equals( ContentVersionHelper.PERMISSIONS_KEY ) );
    }

    @SuppressWarnings("UnusedDeclaration")
    public String getModifier()
    {
        return modifier;
    }

    @SuppressWarnings("UnusedDeclaration")
    public Instant getTimestamp()
    {
        return timestamp;
    }

    @SuppressWarnings("UnusedDeclaration")
    public Instant getModified()
    {
        return modified;
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
    public String getModifierDisplayName()
    {
        return modifierDisplayName;
    }

    @SuppressWarnings("unused")
    public ContentVersionPublishInfoJson getPublishInfo()
    {
        return publishInfo;
    }

    @Deprecated
    public boolean isPermissionsChanged()
    {
        return permissionsChanged;
    }

    public String getPath()
    {
        return contentPath;
    }

    @Deprecated
    public ChildOrderJson getChildOrder()
    {
        return new ChildOrderJson( ChildOrder.defaultOrder() );
    }

    public List<?> getChanges()
    {
        return changes;
    }
}
