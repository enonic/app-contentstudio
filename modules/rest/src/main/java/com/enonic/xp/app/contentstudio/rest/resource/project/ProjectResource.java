package com.enonic.xp.app.contentstudio.rest.resource.project;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.contentstudio.json.task.TaskResultJson;
import com.enonic.xp.app.contentstudio.rest.AdminRestConfig;
import com.enonic.xp.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.xp.app.contentstudio.rest.resource.content.task.ProjectsSyncTask;
import com.enonic.xp.app.contentstudio.rest.resource.project.json.CreateProjectParamsJson;
import com.enonic.xp.app.contentstudio.rest.resource.project.json.DeleteProjectParamsJson;
import com.enonic.xp.app.contentstudio.rest.resource.project.json.ModifyLanguageParamsJson;
import com.enonic.xp.app.contentstudio.rest.resource.project.json.ModifyPermissionsParamsJson;
import com.enonic.xp.app.contentstudio.rest.resource.project.json.ModifyProjectParamsJson;
import com.enonic.xp.app.contentstudio.rest.resource.project.json.ModifyReadAccessParamsJson;
import com.enonic.xp.app.contentstudio.rest.resource.project.json.ProjectConfigJson;
import com.enonic.xp.app.contentstudio.rest.resource.project.json.ProjectGraphJson;
import com.enonic.xp.app.contentstudio.rest.resource.project.json.ProjectJson;
import com.enonic.xp.app.contentstudio.rest.resource.project.json.ProjectPermissionsJson;
import com.enonic.xp.app.contentstudio.rest.resource.project.json.ProjectsJson;
import com.enonic.xp.attachment.CreateAttachment;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.SyncContentService;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.project.CreateProjectParams;
import com.enonic.xp.project.ModifyProjectIconParams;
import com.enonic.xp.project.ModifyProjectParams;
import com.enonic.xp.project.Project;
import com.enonic.xp.project.ProjectConstants;
import com.enonic.xp.project.ProjectGraph;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.project.ProjectPermissions;
import com.enonic.xp.project.ProjectService;
import com.enonic.xp.project.Projects;
import com.enonic.xp.security.PrincipalKeys;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.acl.AccessControlEntry;
import com.enonic.xp.security.acl.AccessControlList;
import com.enonic.xp.security.acl.Permission;
import com.enonic.xp.security.auth.AuthenticationInfo;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.task.SubmitLocalTaskParams;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;
import com.enonic.xp.util.ByteSizeParser;
import com.enonic.xp.web.multipart.MultipartForm;
import com.enonic.xp.web.multipart.MultipartItem;

import static java.util.stream.Collectors.toList;

@SuppressWarnings("UnusedDeclaration")
@Path(ResourceConstants.REST_ROOT + "project")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_ID, RoleKeys.ADMIN_LOGIN_ID})
@Component(immediate = true, property = "group=v2cs", configurationPid = "com.enonic.xp.project")
public final class ProjectResource
    implements JaxRsComponent
{
    private static final Logger LOG = LoggerFactory.getLogger( ProjectResource.class );

    private ProjectService projectService;

    private TaskService taskService;

    private ContentService contentService;

    private SyncContentService syncContentService;

    private volatile long uploadMaxFileSize;

    private ProjectConfig projectConfig;

    @Activate
    @Modified
    public void activate( final AdminRestConfig config, final ProjectConfig projectConfig )
    {
        uploadMaxFileSize = ByteSizeParser.parse( config.uploadMaxFileSize() );
        this.projectConfig = projectConfig;
    }

    @POST
    @Path("create")
    public ProjectJson create( final CreateProjectParamsJson json )
        throws Exception
    {
        final Project project = projectService.create( createParams( json ) );
        return doCreateJson( project );
    }

    @POST
    @Path("modify")
    public ProjectJson modify( final ModifyProjectParamsJson json )
        throws Exception
    {
        final Project modifiedProject = this.projectService.modify( createParams( json ) );
        return doCreateJson( modifiedProject );
    }

    @POST
    @Path("modifyLanguage")
    public String modifyLanguage( final ModifyLanguageParamsJson params )
    {
        return doApplyLanguage( params.getName(), params.getLanguage() ).map( Locale::toLanguageTag ).orElse( null );
    }

    @POST
    @Path("modifyPermissions")
    public ProjectPermissionsJson modifyPermissions( final ModifyPermissionsParamsJson params )
    {
        final ProjectPermissions projectPermissions = doApplyPermissions( params.getName(), params.getPermissions() );
        return new ProjectPermissionsJson( projectPermissions );
    }

    @POST
    @Path("modifyReadAccess")
    public TaskResultJson modifyReadAccess( final ModifyReadAccessParamsJson params )
    {
        return doApplyReadAccess( params.getName(), params.getReadAccess() );
    }

    @POST
    @Path("modifyIcon")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public void modifyIcon( final MultipartForm form )
    {
        final ModifyProjectIconParams params = ModifyProjectIconParams.create()
            .name( ProjectName.from( form.getAsString( "name" ) ) )
            .scaleWidth( Integer.parseInt( form.getAsString( "scaleWidth" ) ) )
            .icon( createIcon( form ) )
            .build();

        this.projectService.modifyIcon( params );
    }

    @POST
    @Path("delete")
    public boolean delete( final DeleteProjectParamsJson params )
    {
        return this.projectService.delete( params.getName() );
    }

    @GET
    @Path("list")
    public ProjectsJson list( @QueryParam("resolveUnavailable") final boolean resolveUnavailable )
    {
        final Projects availableProjects = this.projectService.list();
        final Projects projects = resolveUnavailable ? addUnavailableProjects( availableProjects ) : availableProjects;

        return new ProjectsJson( projects.stream()
                                     .map( project -> project.getDisplayName() != null // no displayName means project is read-only
                                         ? doCreateJson( project )
                                         : doCreateJson( project, null, null, null ) )
                                     .collect( toList() ) );
    }

    private Projects addUnavailableProjects( final Projects availableProjects)
    {
        final Map<ProjectName, Project> allProjects =
            adminContext().callWith( () -> projectService.list().stream().collect( Collectors.toMap( Project::getName, p -> p ) ) );

        final Map<ProjectName, Project> result =
            availableProjects.stream().collect( Collectors.toMap( Project::getName, p -> p ) );

        availableProjects.forEach( availableProject -> {
            ProjectName parentName = availableProject.getParent();

            while ( parentName != null && !result.containsKey( parentName ) )
            {
                final Project parentProject = allProjects.get( parentName );

                if ( parentProject != null )
                {
                    result.putIfAbsent( parentName, createReadOnlyProject( parentProject ) );
                    parentName = parentProject.getParent();
                }
                else
                {
                    parentName = null;
                }
            }
        } );

        return Projects.from( result.values() );
    }

    private Context adminContext()
    {
        return ContextBuilder.from( ContextAccessor.current() )
            .authInfo( AuthenticationInfo.copyOf( ContextAccessor.current().getAuthInfo() ).principals( RoleKeys.ADMIN ).build() )
            .build();
    }

    private Project createReadOnlyProject( final Project source )
    {
        final Project.Builder projectBuilder = Project.create().name( source.getName() );

        if (source.getParent() != null) {
            projectBuilder.parent( source.getParent() );
        }

        return projectBuilder.build();
    }

    @GET
    @Path("config")
    public ProjectConfigJson config()
    {
        return new ProjectConfigJson( projectConfig.multiInheritance() );
    }

    @GET
    @Path("fetchByContentId")
    public ProjectsJson fetchByContentId( @QueryParam("contentId") final String contentIdString )
    {
        final ContentId contentId = ContentId.from( contentIdString );

        final List<ProjectJson> projects = this.projectService.list()
            .stream()
            .filter( project -> ContextBuilder.from( ContextAccessor.current() )
                .repositoryId( project.getName().getRepoId() )
                .branch( ContentConstants.BRANCH_DRAFT )
                .build()
                .callWith( () -> contentService.contentExists( contentId ) ) )
            .map( this::doCreateJson )
            .collect( toList() );

        return new ProjectsJson( projects );
    }

    @GET
    @Path("get")
    public ProjectJson get( final @QueryParam("name") String projectNameValue )
    {
        final ProjectName projectName = ProjectName.from( projectNameValue );
        return doCreateJson( this.projectService.get( projectName ) );
    }

    @GET
    @Path("getTree")
    public ProjectGraphJson getTree( final @QueryParam("name") String projectNameValue )
    {
        final ProjectGraph graph = this.projectService.graph( ProjectName.from( projectNameValue ) );
        return new ProjectGraphJson( graph );
    }

    @POST
    @Path("syncAll")
    public TaskResultJson syncAll()
    {
        final ProjectsSyncTask task =
            ProjectsSyncTask.create().projectService( projectService ).syncContentService( syncContentService ).build();
        final SubmitLocalTaskParams params = SubmitLocalTaskParams.create().runnableTask( task ).description( "Sync all projects" ).build();
        final TaskId taskId = taskService.submitLocalTask( params );
        return new TaskResultJson( taskId );
    }

    private CreateProjectParams createParams( final CreateProjectParamsJson json )
    {
        final CreateProjectParams.Builder paramsBuilder = CreateProjectParams.create()
            .name( json.getName() )
            .displayName( json.getDisplayName() )
            .description( json.getDescription() )
            .addParents( json.getParents() )
            .forceInitialization( true );

        json.getApplicationConfigs().stream().forEach( paramsBuilder::addSiteConfig );

        if ( json.getReadAccess() != null && ProjectReadAccessType.PUBLIC.equals( json.getReadAccess().getType() ) )
        {
            paramsBuilder.permissions( AccessControlList.create()
                                           .add(
                                               AccessControlEntry.create().principal( RoleKeys.EVERYONE ).allow( Permission.READ ).build() )
                                           .build() );
        }

        return paramsBuilder.build();
    }

    private SiteConfig appKeyToSiteConfig( final ApplicationKey key )
    {
        return SiteConfig.create().application( key ).config( new PropertyTree() ).build();
    }

    private ModifyProjectParams createParams( final ModifyProjectParamsJson json )
    {
        final ModifyProjectParams.Builder paramsBuilder =
            ModifyProjectParams.create().name( json.getName() ).displayName( json.getDisplayName() ).description( json.getDescription() );

        json.getApplicationConfigs().stream().forEach( paramsBuilder::addSiteConfig );

        return paramsBuilder.build();
    }

    private CreateAttachment createIcon( final MultipartForm form )
    {
        final MultipartItem icon = form.get( "icon" );

        if ( icon == null )
        {
            return null;
        }
        checkSize( icon );
        return CreateAttachment.create()
            .name( ProjectConstants.PROJECT_ICON_PROPERTY )
            .label( icon.getFileName() )
            .mimeType( icon.getContentType().toString() )
            .byteSource( icon.getBytes() )
            .build();
    }

    private void checkSize( final MultipartItem mediaFile )
    {
        if ( mediaFile.getSize() > uploadMaxFileSize )
        {
            throw new IllegalStateException( "File size exceeds maximum allowed upload size" );
        }
    }

    private ProjectJson doCreateJson( final Project project, final ProjectPermissions projectPermissions,
                                      final ProjectReadAccessType readAccessType, final Locale language )
    {
        return new ProjectJson( project, projectPermissions, readAccessType, language );
    }

    private ProjectJson doCreateJson( final Project project )
    {
        final ProjectName projectName = project.getName();

        final ProjectPermissions projectPermissions = doFetchPermissions( projectName );
        final ProjectReadAccessType readAccessType = doFetchReadAccess( projectName, projectPermissions.getViewer() ).getType();
        final Locale language = doFetchLanguage( projectName );

        return doCreateJson( project, projectPermissions, readAccessType, language );
    }

    private ProjectPermissions doFetchPermissions( final ProjectName projectName )
    {
        return this.projectService.getPermissions( projectName );
    }

    private ProjectReadAccess doFetchReadAccess( final ProjectName projectName, final PrincipalKeys viewerRoleMembers )
    {
        return GetProjectReadAccessCommand.create()
            .viewerRoleMembers( viewerRoleMembers )
            .projectName( projectName )
            .contentService( contentService )
            .build()
            .execute();
    }

    private Locale doFetchLanguage( final ProjectName projectName )
    {
        return GetProjectLanguageCommand.create().projectName( projectName ).contentService( contentService ).build().execute();
    }

    private ProjectPermissions doApplyPermissions( final ProjectName projectName, final ProjectPermissions projectPermissions )
    {
        return projectService.modifyPermissions( projectName, projectPermissions );
    }

    private Optional<Locale> doApplyLanguage( final ProjectName projectName, final Locale language )
    {
        final Locale result = ApplyProjectLanguageCommand.create()
            .projectName( projectName )
            .language( language )
            .contentService( contentService )
            .build()
            .execute();

        return Optional.ofNullable( result );
    }

    private TaskResultJson doApplyReadAccess( final ProjectName projectName, final ProjectReadAccess readAccess )
    {
        return ApplyProjectReadAccessPermissionsCommand.create()
            .projectName( projectName )
            .readAccess( readAccess )
            .taskService( taskService )
            .contentService( contentService )
            .build()
            .execute();
    }

    @Reference
    public void setProjectService( final ProjectService projectService )
    {
        this.projectService = projectService;
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

    @Reference
    public void setSyncContentService( final SyncContentService syncContentService )
    {
        this.syncContentService = syncContentService;
    }
}
