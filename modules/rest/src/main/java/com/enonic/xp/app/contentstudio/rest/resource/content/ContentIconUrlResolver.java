package com.enonic.xp.app.contentstudio.rest.resource.content;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.xp.app.ApplicationNotFoundException;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.ContentTypeIconResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.ContentTypeIconUrlResolver;
import com.enonic.xp.attachment.AttachmentNames;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.Media;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.project.ProjectConstants;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.web.servlet.ServletRequestUrlHelper;

public final class ContentIconUrlResolver
{
    private final ContentTypeIconUrlResolver contentTypeIconUrlResolver;

    private final HttpServletRequest servletRequest;

    public ContentIconUrlResolver( final ContentTypeService contentTypeService, final HttpServletRequest servletRequest )
    {
        final ContentTypeIconResolver contentTypeIconResolver = new ContentTypeIconResolver( contentTypeService );
        this.contentTypeIconUrlResolver = new ContentTypeIconUrlResolver( contentTypeIconResolver, servletRequest );
        this.servletRequest = servletRequest;
    }

    public String resolve( final Content content )
    {
        if ( content.getAttachments().byName( AttachmentNames.THUMBNAIL ) != null )
        {
            return makeIconPath( content );
        }

        if ( isImageWithAttachment( content ) )
        {
            return makeIconPath( content );
        }

        try
        {
            return this.contentTypeIconUrlResolver.resolve( content.getType() );
        }
        catch ( final ApplicationNotFoundException exception )
        {
            return null;
        }
    }

    private boolean isImageWithAttachment( final Content content )
    {
        if ( !isImage( content ) )
        {
            return false;
        }

        return ( (Media) content ).getMediaAttachment() != null;
    }

    private boolean isImage( final Content content )
    {
        if ( !( content instanceof Media ) )
        {
            return false;
        }

        return ( (Media) content ).isImage();
    }

    private String makeIconPath( final Content content )
    {
        return ServletRequestUrlHelper.createUri( servletRequest,
                                                  ResourceConstants.REST_ROOT + "cms/" + getProjectName() + "/" + getLayer() +
                                                      "/content/icon/" + content.getId() + "?ts=" +
                                                      content.getModifiedTime().toEpochMilli() );
    }

    private String getProjectName()
    {
        final String project =
            ContextAccessor.current().getRepositoryId().toString().replace( ProjectConstants.PROJECT_REPO_ID_PREFIX, "" );
        return project;
    }

    private String getLayer()
    {
        return ContentHelper.getContentRoot().toString();
    }
}
