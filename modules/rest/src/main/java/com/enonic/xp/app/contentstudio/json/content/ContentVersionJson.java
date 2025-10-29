package com.enonic.xp.app.contentstudio.json.content;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ChildOrderJson;
import com.enonic.xp.content.ContentVersion;
import com.enonic.xp.index.ChildOrder;
import com.enonic.xp.node.Attributes;
import com.enonic.xp.security.Principal;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.util.GenericValue;

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

    private final Attributes attributes;

    public ContentVersionJson( final ContentVersion contentVersion, final ContentPrincipalsResolver principalsResolver )
    {
        this.modified = Objects.requireNonNullElse( contentVersion.getChangedTime(), contentVersion.getTimestamp() );
        this.timestamp = contentVersion.getTimestamp();
        this.comment = contentVersion.getComment();
        this.contentPath = contentVersion.getPath().toString();

        final PrincipalKey changedBy = contentVersion.getChangedBy();
        final Principal modifier = changedBy != null ? principalsResolver.findPrincipal( changedBy ) : null;

        this.modifierDisplayName = modifier != null ? modifier.getDisplayName() : "";
        this.modifier = changedBy != null ? changedBy.toString() : null;

        this.id = contentVersion.getId().toString();
        if ( contentVersion.getPublishedFrom() != null )
        {
            this.publishInfo = new ContentVersionPublishInfoJson( contentVersion.getPublishedBy(), contentVersion.getPublishedTime(),
                                                                  contentVersion.getComment(), "PUBLISHED",
                                                                  new ContentPublishInfoJson( contentVersion.getPublishedFrom(),
                                                                                              contentVersion.getPublishedTo() ),
                                                                  principalsResolver );
        }
        else
        {
            this.publishInfo = null;
        }

        // TODO for debugging only. remove before release
        this.attributes = contentVersion.getAttributes();

        this.permissionsChanged = "content.permissions".equals( contentVersion.getChange() );
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

    @Deprecated
    public List<Object> getAttributes()
    {
        return attributes != null ? attributes.list().stream().map( GenericValue::rawJava ).toList() : List.of();
    }
}
