package com.enonic.app.contentstudio.json.content;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.enonic.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.app.contentstudio.rest.resource.content.ContentPublishInfoResolver;
import com.enonic.app.contentstudio.rest.resource.content.json.ChildOrderJson;
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

    private final List<ActionJson> changes;

    public ContentVersionJson( final ContentVersion version, final ContentPrincipalsResolver principalsResolver,
                               final ContentPublishInfoResolver contentPublishInfoResolver )
    {
        this.timestamp = version.getTimestamp();
        this.comment = version.getComment();
        this.contentPath = version.getPath().toString(); // TODO not essential
        this.id = version.getVersionId().toString();

        final Optional<ContentVersion.Action> modChange = version.getActions()
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
            this.modified = version.getTimestamp(); // TODO just to make old UI happy
        }

        // TODO just an example. In reality one version can have multiple attributes

        ContentVersionPublishInfoJson info = version.getActions()
            .stream()
            .filter( c -> c.operation().equals( ContentVersionHelper.PUBLISH_KEY ) )
            .findFirst()
            .map( c -> {
                return new ContentVersionPublishInfoJson( c.user(), c.opTime(), version.getComment(), "PUBLISHED",
                                                          new ContentPublishInfoJson(
                                                              contentPublishInfoResolver.resolvePublishInfo( version.getContentId(),
                                                                                                             version.getVersionId() ) ),
                                                          principalsResolver );
            } )
            .orElse( null );

        // TODO This is just an example to make old UI work. unpublishing happens on the same version as publishing
        info = version.getActions()
            .stream()
            .filter( c -> c.operation().equals( ContentVersionHelper.UNPUBLISH_KEY ) )
            .findFirst()
            .map( c -> {
                return new ContentVersionPublishInfoJson( c.user(), c.opTime(), version.getComment(), "UNPUBLISHED",
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
                        : new ContentVersionPublishInfoJson( c.user(), c.opTime(), version.getComment(),
                                                             commitType, null, principalsResolver );
                } )).orElse( null );
        }

        this.publishInfo = info;

        this.changes = version.getActions()
            .stream()
            .map( c -> new ActionJson( c.operation(), c.fields(), c.user().toString(), c.opTime() ) )
            .toList();

        this.permissionsChanged = version.getActions()
            .stream()
            .map( ContentVersion.Action::operation )
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

    public List<ActionJson> getActions()
    {
        return changes;
    }
}
