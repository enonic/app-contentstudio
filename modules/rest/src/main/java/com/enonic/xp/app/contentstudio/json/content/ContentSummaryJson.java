package com.enonic.xp.app.contentstudio.json.content;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import com.enonic.xp.app.contentstudio.json.ChangeTraceableJson;
import com.enonic.xp.app.contentstudio.json.ItemJson;
import com.enonic.xp.app.contentstudio.json.thumb.ThumbnailJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.ContentIconUrlResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.ContentListTitleResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.ChildOrderJson;
import com.enonic.xp.attachment.AttachmentNames;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentInheritType;

@SuppressWarnings("UnusedDeclaration")
public class ContentSummaryJson
    extends ContentIdJson
    implements ChangeTraceableJson, ItemJson
{
    protected final Content content;

    private final String iconUrl;

    private final String listTitle;

    private final ThumbnailJson thumbnailJson;

    private final boolean isSite;

    private final boolean isPage;

    private final List<ContentInheritType> inherit;

    private final ChildOrderJson childOrderJson;

    private final ContentPublishInfoJson publish;

    private final ContentWorkflowInfoJson workflow;

    private final String originProject;

    private final String originalParentPath;

    private final String originalName;

    private final String variantOf;

    private final Boolean hasChildren;

    public ContentSummaryJson( final Content content, Boolean hasChildren, final ContentIconUrlResolver iconUrlResolver,
                               ContentListTitleResolver contentListTitleResolver )
    {
        super( content.getId() );
        this.content = content;
        this.iconUrl = iconUrlResolver.resolve( content );
        this.listTitle = contentListTitleResolver.resolve( content );
        this.thumbnailJson =
            Optional.ofNullable( content.getAttachments().byName( AttachmentNames.THUMBNAIL ) ).map( ThumbnailJson::new ).orElse( null );
        this.isSite = content.isSite();
        this.isPage = content.getPage() != null;
        this.inherit = content.getInherit().stream().sorted().collect( Collectors.toList() );
        this.childOrderJson = content.getChildOrder() != null ? new ChildOrderJson( content.getChildOrder() ) : null;
        this.publish = content.getPublishInfo() != null ? new ContentPublishInfoJson( content.getPublishInfo() ) : null;
        this.workflow = content.getWorkflowInfo() != null ? new ContentWorkflowInfoJson( content.getWorkflowInfo() ) : null;
        this.originProject = Objects.toString( content.getOriginProject(), null );
        this.originalParentPath = Objects.toString( content.getOriginalParentPath(), null );
        this.originalName = Objects.toString( content.getOriginalName(), null );
        this.variantOf = Objects.toString( content.getVariantOf(), null );
        this.hasChildren = hasChildren;
    }

    public String getIconUrl()
    {
        return iconUrl;
    }

    public ThumbnailJson getThumbnail()
    {
        return this.thumbnailJson;
    }

    public String getPath()
    {
        return content.getPath().toString();
    }

    public String getName()
    {
        return content.getName().toString();
    }

    public String getType()
    {
        return content.getType() != null ? content.getType().toString() : null;
    }

    public String getDisplayName()
    {
        return content.getDisplayName();
    }

    public String getListTitle()
    {
        return listTitle;
    }

    public String getOwner()
    {
        return content.getOwner() != null ? content.getOwner().toString() : null;
    }

    public String getLanguage()
    {
        return content.getLanguage() != null ? content.getLanguage().toLanguageTag() : null;
    }

    public boolean getIsRoot()
    {
        return content.getPath().elementCount() == 1;
    }

    public ContentPublishInfoJson getPublish()
    {
        return publish;
    }

    public ContentWorkflowInfoJson getWorkflow()
    {
        return workflow;
    }

    @Override
    public Instant getCreatedTime()
    {
        return content.getCreatedTime();
    }

    @Override
    public String getCreator()
    {
        return content.getCreator() != null ? content.getCreator().toString() : null;
    }

    @Override
    public Instant getModifiedTime()
    {
        return content.getModifiedTime();
    }

    @Override
    public String getModifier()
    {
        return content.getModifier() != null ? content.getModifier().toString() : null;
    }

    public Instant getArchivedTime()
    {
        return content.getArchivedTime();
    }

    public String getArchivedBy()
    {
        return content.getArchivedBy() != null ? content.getArchivedBy().toString() : null;
    }

    public Boolean getHasChildren()
    {
        return hasChildren;
    }

    public boolean getIsValid()
    {
        return content.isValid();
    }

    public ChildOrderJson getChildOrder()
    {
        return this.childOrderJson;
    }

    public boolean getIsPage()
    {
        return isPage;
    }

    public List<ContentInheritType> getInherit()
    {
        return inherit;
    }

    public String getOriginProject()
    {
        return this.originProject;
    }

    public String getOriginalParentPath()
    {
        return this.originalParentPath;
    }

    public String getOriginalName()
    {
        return originalName;
    }

    @Override
    public boolean getEditable()
    {
        return true;
    }

    @Override
    public boolean getDeletable()
    {
        return true;
    }

    public String getVariantOf()
    {
        return variantOf;
    }
}
