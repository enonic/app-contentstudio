package com.enonic.app.contentstudio.rest.resource.content;

import jakarta.servlet.http.HttpServletRequest;

import com.enonic.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.app.contentstudio.rest.resource.schema.content.ContentTypeIconResolver;
import com.enonic.app.contentstudio.rest.resource.schema.content.ContentTypeIconUrlResolver;
import com.enonic.xp.app.ApplicationNotFoundException;
import com.enonic.xp.attachment.AttachmentNames;
import com.enonic.xp.branch.Branch;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.Media;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.portal.url.ImageUrlGeneratorParams;
import com.enonic.xp.portal.url.PortalUrlGeneratorService;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.web.servlet.ServletRequestUrlHelper;

public final class ContentIconUrlResolver
{
    private static final String ICON_SCALE = "square(128)";

    private static final String ADMIN_TOOL_BASE_URL = "/admin/com.enonic.app.contentstudio/main";

    private final ContentTypeIconUrlResolver contentTypeIconUrlResolver;

    private final PortalUrlGeneratorService portalUrlGeneratorService;

    private final HttpServletRequest servletRequest;

    public ContentIconUrlResolver( final ContentTypeService contentTypeService, final PortalUrlGeneratorService portalUrlGeneratorService,
                                   final HttpServletRequest servletRequest )
    {
        final ContentTypeIconResolver contentTypeIconResolver = new ContentTypeIconResolver( contentTypeService );
        this.contentTypeIconUrlResolver = new ContentTypeIconUrlResolver( contentTypeIconResolver, servletRequest );
        this.portalUrlGeneratorService = portalUrlGeneratorService;
        this.servletRequest = servletRequest;
    }

    public String resolve( final Content content )
    {
        if ( content.getAttachments().byName( AttachmentNames.THUMBNAIL ) != null )
        {
            return makeLegacyThumbnailUrl( content );
        }

        if ( isImageWithAttachment( content ) )
        {
            return makeImageApiUrl( (Media) content );
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
        return ( content.getType().isImageMedia() || content.getType().isVectorMedia() ) &&
            content.getAttachments().byLabel( "source" ) != null;
    }

    private String makeImageApiUrl( final Media media )
    {
        final ProjectName projectName = getProjectName();
        final Branch branch = ContextAccessor.current().getBranch();

        final ImageUrlGeneratorParams params = ImageUrlGeneratorParams.create()
            .setBaseUrl( ADMIN_TOOL_BASE_URL )
            .setMedia( () -> media )
            .setProjectName( () -> projectName )
            .setBranch( () -> branch )
            .setScale( ICON_SCALE )
            .build();

        return ServletRequestUrlHelper.createUri( servletRequest, portalUrlGeneratorService.imageUrl( params ) );
    }

    private String makeLegacyThumbnailUrl( final Content content )
    {
        return ServletRequestUrlHelper.createUri( servletRequest,
                                                  ResourceConstants.REST_ROOT + "cms/" + getProjectName() + "/" + getLayer() +
                                                      "/content/icon/" + content.getId() + "?ts=" +
                                                      content.getModifiedTime().toEpochMilli() );
    }

    private ProjectName getProjectName()
    {
        return ProjectName.from( ContextAccessor.current().getRepositoryId() );
    }

    private String getLayer()
    {
        return ContentHelper.getContentRoot().toString();
    }
}
