package com.enonic.app.contentstudio.rest.resource.archive;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.enonic.app.contentstudio.rest.resource.archive.json.ArchiveContentJson;
import com.enonic.app.contentstudio.rest.resource.archive.json.RestoreContentJson;
import com.enonic.app.contentstudio.rest.resource.content.task.ArchiveRunnableTask;
import com.enonic.app.contentstudio.rest.resource.content.task.RestoreRunnableTask;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.security.RoleKeys;
import com.enonic.app.contentstudio.json.task.TaskResultJson;
import com.enonic.xp.task.TaskService;

import static com.enonic.app.contentstudio.rest.resource.ResourceConstants.CONTENT_CMS_PATH;
import static com.enonic.app.contentstudio.rest.resource.ResourceConstants.REST_ROOT;

@SuppressWarnings("UnusedDeclaration")
@Path(REST_ROOT + "{content:(content|" + CONTENT_CMS_PATH + "/content)}/archive")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class ArchiveResource
    implements JaxRsComponent
{
    private static final Logger LOG = LoggerFactory.getLogger( ArchiveResource.class );

    private ContentService contentService;

    private TaskService taskService;

    @POST
    @Path("archive")
    public TaskResultJson archive( final ArchiveContentJson params )
    {
        return ArchiveRunnableTask.create()
            .params( params )
            .description( "Archive content" )
            .taskService( taskService )
            .contentService( contentService )
            .build()
            .createTaskResult();
    }

    @POST
    @Path("restore")
    public TaskResultJson restore( final RestoreContentJson params )
    {
        return RestoreRunnableTask.create()
            .params( params )
            .description( "Restore content" )
            .taskService( taskService )
            .contentService( contentService )
            .build()
            .createTaskResult();
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }

    @Reference
    public void setTaskService( final TaskService taskService )
    {
        this.taskService = taskService;
    }
}
