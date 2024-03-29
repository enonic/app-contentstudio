package com.enonic.xp.app.contentstudio.rest.resource.task;

import java.util.List;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.task.json.TaskInfoJson;
import com.enonic.xp.app.contentstudio.rest.resource.task.json.TaskInfoListJson;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskInfo;
import com.enonic.xp.task.TaskService;

@Path(ResourceConstants.REST_ROOT + "tasks")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class TaskResource
    implements JaxRsComponent
{

    private TaskService taskService;

    @GET
    @Path("/")
    public TaskInfoListJson list()
    {
        final List<TaskInfo> taskList = taskService.getAllTasks();
        return new TaskInfoListJson( taskList );
    }

    @GET
    @Path("/{taskId}")
    public TaskInfoJson getTask( @PathParam("taskId") final String taskIdStr )
        throws Exception
    {
        final TaskId taskId = TaskId.from( taskIdStr );
        final TaskInfo taskInfo = taskService.getTaskInfo( taskId );

        if ( taskInfo == null )
        {
            throw new WebApplicationException( String.format( "Task [%s] was not found", taskIdStr ), Response.Status.NOT_FOUND );
        }
        return new TaskInfoJson( taskInfo );
    }

    @Reference
    public void setTaskService( final TaskService taskService )
    {
        this.taskService = taskService;
    }
}
