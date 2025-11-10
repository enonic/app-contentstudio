package com.enonic.app.contentstudio.rest.resource.issue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import jakarta.annotation.security.RolesAllowed;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.google.common.net.HttpHeaders;

import com.enonic.app.contentstudio.json.issue.DeleteIssueCommentResultJson;
import com.enonic.app.contentstudio.json.issue.IssueCommentJson;
import com.enonic.app.contentstudio.json.issue.IssueCommentListJson;
import com.enonic.app.contentstudio.json.issue.IssueJson;
import com.enonic.app.contentstudio.json.issue.IssueListJson;
import com.enonic.app.contentstudio.json.issue.IssueStatsJson;
import com.enonic.app.contentstudio.json.issue.IssuesJson;
import com.enonic.app.contentstudio.rest.resource.ResourceConstants;
import com.enonic.app.contentstudio.rest.resource.issue.json.CountStatsJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.CreateIssueCommentJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.CreateIssueJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.DeleteIssueCommentJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.FindIssuesJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.FindIssuesParams;
import com.enonic.app.contentstudio.rest.resource.issue.json.GetIssuesJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.ListIssueCommentsJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.ListIssuesJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.UpdateIssueCommentJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.UpdateIssueJson;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.issue.CreateIssueCommentParams;
import com.enonic.xp.issue.CreateIssueParams;
import com.enonic.xp.issue.CreatePublishRequestIssueParams;
import com.enonic.xp.issue.DeleteIssueCommentParams;
import com.enonic.xp.issue.DeleteIssueCommentResult;
import com.enonic.xp.issue.EditablePublishRequestIssue;
import com.enonic.xp.issue.FindIssueCommentsResult;
import com.enonic.xp.issue.FindIssuesResult;
import com.enonic.xp.issue.Issue;
import com.enonic.xp.issue.IssueComment;
import com.enonic.xp.issue.IssueCommentQuery;
import com.enonic.xp.issue.IssueId;
import com.enonic.xp.issue.IssueQuery;
import com.enonic.xp.issue.IssueService;
import com.enonic.xp.issue.IssueStatus;
import com.enonic.xp.issue.IssueType;
import com.enonic.xp.issue.UpdateIssueCommentParams;
import com.enonic.xp.issue.UpdateIssueParams;
import com.enonic.xp.jaxrs.JaxRsComponent;
import com.enonic.xp.project.ProjectConstants;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.project.ProjectPermissions;
import com.enonic.xp.project.ProjectRole;
import com.enonic.xp.project.ProjectService;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.PrincipalKeys;
import com.enonic.xp.security.PrincipalNotFoundException;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.security.User;
import com.enonic.xp.security.auth.AuthenticationInfo;

import static com.google.common.base.Strings.isNullOrEmpty;

@SuppressWarnings("UnusedDeclaration")
@Path(ResourceConstants.REST_ROOT + "{content:(issue|" + ResourceConstants.CMS_PATH + "/issue)}")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed({RoleKeys.ADMIN_LOGIN_ID, RoleKeys.ADMIN_ID})
@Component(immediate = true, property = "group=v2cs")
public final class IssueResource
    implements JaxRsComponent
{
    private IssueService issueService;

    private IssueNotificationsSender issueNotificationsSender;

    private SecurityService securityService;

    private ContentService contentService;

    private ContentTypeService contentTypeService;

    private LocaleService localeService;

    private ProjectService projectService;

    @POST
    @Path("create")
    public IssueJson create( final CreateIssueJson json, @Context HttpServletRequest request )
    {
        final Issue issue = issueService.create( generateCreateIssueParams( json ) );
        final List<IssueComment> comments = new ArrayList<>();

        if ( !isNullOrEmpty( json.description ) )
        {
            Optional<User> creator = securityService.getUser( issue.getCreator() );
            if ( creator.isPresent() )
            {
                CreateIssueCommentParams params = CreateIssueCommentParams.create().
                    issue( issue.getId() ).
                    creator( issue.getCreator() ).
                    creatorDisplayName( creator.get().getDisplayName() ).
                    text( json.description ).
                    build();

                comments.add( issueService.createComment( params ) );
            }
        }

        final IssueNotificationParams createdParams = IssueNotificationParamsFactory.create()
            .securityService( securityService )
            .contentService( contentService )
            .contentTypeService( contentTypeService )
            .localeService( localeService )
            .locales( request.getLocales() )
            .issue( issue )
            .comments( comments )
            .url( request.getHeader( HttpHeaders.REFERER ) )
            .build()
            .createdParams();

        issueNotificationsSender.notifyIssueCreated( createdParams );

        return new IssueJson( issue );
    }

    @POST
    @Path("getIssues")
    public IssuesJson getByIds( final GetIssuesJson params )
    {
        final IssuesJson result = new IssuesJson();
        for ( IssueId id : params.getIssueIds() )
        {
            result.addIssue( issueService.getIssue( id ) );
        }

        return result;
    }

    @POST
    @Path("findIssues")
    public IssuesJson find( final FindIssuesJson params )
    {
        final IssueQuery query = createIssueQuery( params.getFindIssuesParams() );
        final FindIssuesResult findResult = issueService.findIssues( query );

        final IssuesJson result = new IssuesJson();
        result.addIssues( findResult.getIssues() );

        return result;
    }

    @GET
    @Path("id")
    public IssueJson getById( @QueryParam("id") final String id )
    {
        final Issue issue = issueService.getIssue( IssueId.from( id ) );
        return new IssueJson( issue );
    }

    @POST
    @Path("update")
    public IssueJson update( final UpdateIssueJson params, @Context HttpServletRequest request )
    {
        final Issue issueToEdit = issueService.getIssue( params.issueId );
        final PrincipalKeys validAssignees =
            params.approverIds != null ? filterInvalidAssignees( params.approverIds ) : PrincipalKeys.empty();

        final PrincipalKeys addedAssignees = filterKeys( issueToEdit.getApproverIds(), validAssignees, false );
        final PrincipalKeys existingAssignees = filterKeys( issueToEdit.getApproverIds(), validAssignees, true );

        final Issue issue = issueService.update( generateUpdateIssueParams( params ) );

        IssueCommentQuery query = IssueCommentQuery.create().issue( issue.getId() ).build();
        final List<IssueComment> comments = issueService.findComments( query ).getIssueComments();
        final String referer = request.getHeader( HttpHeaders.REFERER );

        if ( addedAssignees.getSize() > 0 )
        {
            final IssueNotificationParams createdParams = IssueNotificationParamsFactory.create().
                securityService( securityService ).
                contentService( contentService ).
                contentTypeService( contentTypeService ).
                localeService( localeService ).
                locales( request.getLocales() ).
                issue( issue ).
                comments( comments ).
                url( request.getHeader( HttpHeaders.REFERER ) ).
                recipients( addedAssignees ).
                build().
                createdParams();

            issueNotificationsSender.notifyIssueCreated( createdParams );
        }

        if ( !params.autoSave )
        {
            final IssueNotificationParamsFactory.Builder paramsBuilder = IssueNotificationParamsFactory.create().
                securityService( securityService ).
                contentService( contentService ).
                contentTypeService( contentTypeService ).
                localeService( localeService ).
                locales( request.getLocales() ).
                issue( issue ).
                comments( comments ).
                url( request.getHeader( HttpHeaders.REFERER ) );

            if ( params.isPublish )
            {
                issueNotificationsSender.notifyIssuePublished( paramsBuilder.build().publishedParams() );
            }
            else
            {
                issueNotificationsSender.notifyIssueUpdated( paramsBuilder.recipients( existingAssignees ).build().updatedParams() );
            }
        }

        return new IssueJson( issue );
    }

    @GET
    @Path("stats")
    @Deprecated
    public IssueStatsJson getStats()
    {
        return countIssues( null );
    }

    @POST
    @Path("stats")
    public IssueStatsJson getStatsByType( final CountStatsJson json )
    {
        return countIssues( json.getIssueType() );
    }

    @POST
    @Path("comment")
    public IssueCommentJson comment( final CreateIssueCommentJson json, @Context HttpServletRequest request )
    {
        final Issue issue = issueService.getIssue( json.issueId );
        final Optional<User> creator = securityService.getUser( json.creator );

        if ( !creator.isPresent() )
        {
            throw new PrincipalNotFoundException( json.creator );
        }

        CreateIssueCommentParams params = CreateIssueCommentParams.create().
            issue( issue.getId() ).
            text( json.text ).
            creator( creator.get().getKey() ).
            creatorDisplayName( creator.get().getDisplayName() ).
            build();

        final IssueComment comment = issueService.createComment( params );

        if ( !json.silent )
        {
            final IssueCommentQuery commentsQuery = IssueCommentQuery.create().issue( issue.getId() ).build();
            final FindIssueCommentsResult results = issueService.findComments( commentsQuery );

            IssueCommentedNotificationParams notificationParams = IssueNotificationParamsFactory.create().
                securityService( securityService ).
                contentService( contentService ).
                contentTypeService( contentTypeService ).
                localeService( localeService ).
                locales( request.getLocales() ).
                issue( issue ).
                comments( results.getIssueComments() ).
                url( request.getHeader( HttpHeaders.REFERER ) ).
                build().
                commentedParams();

            issueNotificationsSender.notifyIssueCommented( notificationParams );
        }

        return new IssueCommentJson( comment );
    }

    @POST
    @Path("comment/list")
    public IssueCommentListJson listComments( final ListIssueCommentsJson params )
    {
        final IssueCommentQuery issueQuery = createIssueCommentQuery( params );
        final FindIssueCommentsResult result = this.issueService.findComments( issueQuery );
        final IssueListMetaData metaData =
            IssueListMetaData.create().hits( result.getIssueComments().size() ).totalHits( result.getTotalHits() ).build();

        return new IssueCommentListJson( result.getIssueComments(), metaData );
    }

    @POST
    @Path("comment/delete")
    public DeleteIssueCommentResultJson deleteComment( final DeleteIssueCommentJson json )
    {
        DeleteIssueCommentParams params = DeleteIssueCommentParams.create().
            comment( json.getComment() ).
            build();

        final DeleteIssueCommentResult result = this.issueService.deleteComment( params );

        return new DeleteIssueCommentResultJson( result );
    }

    @POST
    @Path("comment/update")
    public IssueCommentJson updateComment( final UpdateIssueCommentJson json )
    {
        UpdateIssueCommentParams params = UpdateIssueCommentParams.create().
            comment( json.getComment() ).
            text( json.getText() ).
            build();

        final IssueComment result = this.issueService.updateComment( params );

        return new IssueCommentJson( result );
    }

    @POST
    @Path("list")
    public IssueListJson listIssues( final ListIssuesJson params )
    {
        final IssueQuery issueQuery = createIssueQuery( params.getFindIssuesParams() );
        final FindIssuesResult result = this.issueService.findIssues( issueQuery );
        final IssueListMetaData metaData = IssueListMetaData.create().totalHits( result.getTotalHits() ).build();

        if ( params.isResolveAssignees() )
        {
            return new IssueListJson( fetchAssigneesForIssues( result.getIssues() ), metaData );
        }
        else
        {
            return new IssueListJson( result.getIssues(), metaData );
        }
    }

    private IssueCommentQuery createIssueCommentQuery( final ListIssueCommentsJson params )
    {
        return IssueCommentQuery.create().
            issue( params.getIssue() ).
            creator( params.getCreator() ).
            from( params.getFrom() ).
            size( params.getSize() ).
            count( params.isCount() ).
            build();
    }

    private IssueQuery createIssueQuery( final FindIssuesParams params )
    {
        final IssueQuery.Builder builder = IssueQuery.create();

        builder.status( params.getStatus() );
        builder.type( params.getType() );
        builder.from( params.getFrom() );
        builder.size( params.getSize() );
        builder.items( params.getItems() );

        if ( params.isCreatedByMe() )
        {
            final AuthenticationInfo authInfo = ContextAccessor.current().getAuthInfo();
            builder.creator( authInfo.getUser().getKey() );
        }

        if ( params.isAssignedToMe() )
        {
            final AuthenticationInfo authInfo = ContextAccessor.current().getAuthInfo();
            builder.approvers( PrincipalKeys.from( authInfo.getUser().getKey() ) );
        }

        return builder.build();
    }

    private IssueStatsJson countIssues( final IssueType issueType )
    {
        final long open = this.issueService.findIssues(
            createIssueQuery( FindIssuesParams.create().status( IssueStatus.OPEN ).type( issueType ).size( 0 ).build() ) ).getTotalHits();

        final long openAssignedToMe = this.issueService.findIssues( createIssueQuery(
            FindIssuesParams.create().status( IssueStatus.OPEN ).assignedToMe( true ).type( issueType ).size( 0 ).build() ) )
            .getTotalHits();

        final long openCreatedByMe = this.issueService.findIssues( createIssueQuery(
            FindIssuesParams.create().status( IssueStatus.OPEN ).type( issueType ).createdByMe( true ).size( 0 ).build() ) ).getTotalHits();

        final long closed = this.issueService.findIssues(
            createIssueQuery( FindIssuesParams.create().status( IssueStatus.CLOSED ).type( issueType ).size( 0 ).build() ) ).getTotalHits();

        final long closedAssignedToMe = this.issueService.findIssues( createIssueQuery(
            FindIssuesParams.create().status( IssueStatus.CLOSED ).type( issueType ).size( 0 ).assignedToMe( true ).build() ) )
            .getTotalHits();

        final long closedCreatedByMe = this.issueService.findIssues( createIssueQuery(
            FindIssuesParams.create().status( IssueStatus.CLOSED ).type( issueType ).size( 0 ).createdByMe( true ).build() ) )
            .getTotalHits();

        return IssueStatsJson.create()
            .open( open )
            .openAssignedToMe( openAssignedToMe )
            .openCreatedByMe( openCreatedByMe )
            .closed( closed )
            .closedAssignedToMe( closedAssignedToMe )
            .closedCreatedByMe( closedCreatedByMe )
            .build();
    }


    private Map<Issue, List<User>> fetchAssigneesForIssues( final List<Issue> issues )
    {
        final Map<Issue, List<User>> issuesWithAssignees = new HashMap<>();

        issues.forEach( issue -> issuesWithAssignees.put( issue, doFetchAssignees( issue ) ) );

        return issuesWithAssignees;
    }

    private List<User> doFetchAssignees( final Issue issue )
    {
        return issue.getApproverIds()
            .stream()
            .map( key -> securityService.getUser( key ).orElse( null ) )
            .filter( Objects::nonNull )
            .collect( Collectors.toList() );
    }

    private CreateIssueParams generateCreateIssueParams( final CreateIssueJson json )
    {
        final CreateIssueParams.Builder builder;

        if ( IssueType.PUBLISH_REQUEST == json.type )
        {
            builder = CreatePublishRequestIssueParams.create().
                schedule( json.schedule );
        }
        else
        {
            builder = CreateIssueParams.create();
        }

        builder.title( json.title );
        builder.description( json.description );
        builder.setPublishRequest( json.publishRequest );
        builder.setApproverIds( filterInvalidAssignees( json.assignees ) );

        return builder.build();
    }

    private UpdateIssueParams generateUpdateIssueParams( final UpdateIssueJson json )
    {
        return UpdateIssueParams.create().
            id( json.issueId ).
            editor( editMe -> {
                if ( json.title != null )
                {
                    editMe.title = json.title;
                }
                if ( json.description != null )
                {
                    editMe.description = json.description;
                }
                if ( json.issueStatus != null )
                {
                    editMe.issueStatus = json.issueStatus;
                }
                if ( json.approverIds != null )
                {
                    editMe.approverIds = filterInvalidAssignees( json.approverIds );
                }
                if ( json.publishRequest != null )
                {
                    editMe.publishRequest = json.publishRequest;
                }
                if ( editMe instanceof EditablePublishRequestIssue )
                {
                    ( (EditablePublishRequestIssue) editMe ).schedule = json.publishSchedule;
                }
            } ).
            build();
    }

    private static PrincipalKey doCreateRoleKey( final ProjectName projectName, final ProjectRole projectRole )
    {
        final String roleName = ProjectConstants.PROJECT_NAME_PREFIX + projectName + "." + projectRole.name().toLowerCase();
        return PrincipalKey.ofRole( roleName );
    }

    private PrincipalKeys filterInvalidAssignees( final List<PrincipalKey> assignees )
    {
        final ProjectName projectName = ProjectName.from( ContextAccessor.current().getRepositoryId() );

        final PrincipalKeys issuePublisherRoles =
            PrincipalKeys.from( doCreateRoleKey( projectName, ProjectRole.OWNER ), doCreateRoleKey( projectName, ProjectRole.EDITOR ) );

        return PrincipalKeys.from( assignees.
            stream().
            filter( assignee -> this.isValidAssignee( assignee, issuePublisherRoles ) ).
            collect( Collectors.toList() ) );
    }

    private PrincipalKeys filterKeys( final PrincipalKeys oldKeys, final PrincipalKeys newKeys, final boolean existing )
    {
        if ( newKeys.getSize() == 0 )
        {
            return existing ? oldKeys : PrincipalKeys.empty();
        }
        else
        {
            return newKeys.stream().filter( key -> existing == oldKeys.contains( key ) ).collect( PrincipalKeys.collector() );
        }
    }

    private boolean isValidAssignee( final PrincipalKey principalKey, final PrincipalKeys issuePublisherRoles )
    {
        if ( principalKey.isUser() )
        {
            final ProjectName projectName = ProjectName.from( ContextAccessor.current().getRepositoryId() );
            final PrincipalKeys membershipKeys = securityService.getAllMemberships( principalKey );

            final ProjectPermissions projectPermissions = projectService.getPermissions( projectName );

            return membershipKeys.stream().anyMatch(
                membershipKey -> this.hasProjectIssuePermissions( membershipKey, issuePublisherRoles ) );
        }

        return false;
    }

    private boolean hasAdminAccess( final PrincipalKey principalKey )
    {
        return RoleKeys.ADMIN.equals( principalKey ) || RoleKeys.CONTENT_MANAGER_ADMIN.equals( principalKey ) ||
            RoleKeys.CONTENT_MANAGER_EXPERT.equals( principalKey );
    }

    private boolean hasManagerAccess( final PrincipalKey principalKey )
    {
        return this.hasAdminAccess( principalKey ) || RoleKeys.CONTENT_MANAGER_APP.equals( principalKey );
    }

    private boolean hasProjectIssuePermissions( final PrincipalKey principalKey, final PrincipalKeys issuePublisherRoles )
    {
        return this.hasManagerAccess( principalKey ) || this.isProjectOwnerOrEditor( principalKey, issuePublisherRoles );
    }

    private boolean isProjectOwnerOrEditor( final PrincipalKey principalKey, final PrincipalKeys issuePublisherRoles )
    {
        return issuePublisherRoles.contains( principalKey );
    }

    @Reference
    public void setIssueService( final IssueService issueService )
    {
        this.issueService = issueService;
    }

    @Reference
    public void setIssueNotificationsSender( final IssueNotificationsSender issueNotificationsSender )
    {
        this.issueNotificationsSender = issueNotificationsSender;
    }

    @Reference
    public void setSecurityService( final SecurityService securityService )
    {
        this.securityService = securityService;
    }

    @Reference
    public void setContentService( final ContentService contentService )
    {
        this.contentService = contentService;
    }

    @Reference
    public void setContentTypeService( final ContentTypeService contentTypeService )
    {
        this.contentTypeService = contentTypeService;
    }

    @Reference
    public void setLocaleService( final LocaleService localeService )
    {
        this.localeService = localeService;
    }

    @Reference
    public void setProjectService( final ProjectService projectService )
    {
        this.projectService = projectService;
    }

}
