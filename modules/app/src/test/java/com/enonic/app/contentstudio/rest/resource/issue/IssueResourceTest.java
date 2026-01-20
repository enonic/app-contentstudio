package com.enonic.app.contentstudio.rest.resource.issue;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.jboss.resteasy.core.ResteasyContext;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.stubbing.Answer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.core.MediaType;

import com.enonic.app.contentstudio.json.issue.DeleteIssueCommentResultJson;
import com.enonic.app.contentstudio.json.issue.IssueCommentJson;
import com.enonic.app.contentstudio.json.issue.IssueStatsJson;
import com.enonic.app.contentstudio.json.issue.PublishRequestItemJson;
import com.enonic.app.contentstudio.rest.Interpolator;
import com.enonic.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.app.contentstudio.rest.resource.content.json.PublishRequestJson;
import com.enonic.app.contentstudio.rest.resource.content.json.PublishRequestScheduleJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.CountStatsJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.CreateIssueCommentJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.CreateIssueJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.DeleteIssueCommentJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.ListIssuesJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.UpdateIssueCommentJson;
import com.enonic.app.contentstudio.rest.resource.issue.json.UpdateIssueJson;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.xp.context.Context;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.context.LocalScope;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.i18n.MessageBundle;
import com.enonic.xp.issue.CreateIssueCommentParams;
import com.enonic.xp.issue.CreateIssueParams;
import com.enonic.xp.issue.CreatePublishRequestIssueParams;
import com.enonic.xp.issue.DeleteIssueCommentParams;
import com.enonic.xp.issue.DeleteIssueCommentResult;
import com.enonic.xp.issue.FindIssueCommentsResult;
import com.enonic.xp.issue.FindIssuesResult;
import com.enonic.xp.issue.Issue;
import com.enonic.xp.issue.IssueComment;
import com.enonic.xp.issue.IssueCommentQuery;
import com.enonic.xp.issue.IssueId;
import com.enonic.xp.issue.IssueNotFoundException;
import com.enonic.xp.issue.IssueQuery;
import com.enonic.xp.issue.IssueService;
import com.enonic.xp.issue.IssueType;
import com.enonic.xp.issue.PublishRequest;
import com.enonic.xp.issue.PublishRequestIssue;
import com.enonic.xp.issue.PublishRequestItem;
import com.enonic.xp.issue.UpdateIssueCommentParams;
import com.enonic.xp.issue.UpdateIssueParams;
import com.enonic.xp.node.NodeId;
import com.enonic.xp.node.NodeIds;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.project.ProjectPermissions;
import com.enonic.xp.project.ProjectService;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.schema.content.ContentTypeService;
import com.enonic.xp.security.IdProviderKey;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.PrincipalKeys;
import com.enonic.xp.security.PrincipalNotFoundException;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.SecurityService;
import com.enonic.xp.security.User;
import com.enonic.xp.security.auth.AuthenticationInfo;
import com.enonic.xp.session.SessionMock;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class IssueResourceTest
    extends AdminResourceTestSupport
{
    private IssueService issueService;

    private IssueNotificationsSender issueNotificationsSender;

    private SecurityService securityService;

    private ContentService contentService;

    private ContentTypeService contentTypeService;

    private ProjectService projectService;

    private HttpServletRequest mockRequest;

    private LocaleService localeService;

    @Override
    protected IssueResource getResourceInstance()
    {
        final IssueResource resource = new IssueResource();

        issueService = mock( IssueService.class );
        contentService = mock( ContentService.class );
        localeService = mock( LocaleService.class);
        when( contentService.getByIds( isA( GetContentByIdsParams.class ) ) )
            .thenReturn( Contents.from( this.createContent() ) );
        contentTypeService = mock( ContentTypeService.class );
        issueNotificationsSender = mock( IssueNotificationsSender.class );
        securityService = mock( SecurityService.class );
        projectService = mock( ProjectService.class );
        when( securityService.getAllMemberships( isA( PrincipalKey.class ) ) )
            .thenReturn( PrincipalKeys.from( "role:system:one" ) );
        when( securityService.getUser( User.anonymous().getKey() ) ).thenReturn( Optional.of( User.anonymous() ) );
        when( projectService.getPermissions( isA( ProjectName.class ) ) ).thenReturn( createProjectPermissions() );

        resource.setIssueService( issueService );
        resource.setIssueNotificationsSender( issueNotificationsSender );
        resource.setSecurityService( securityService );
        resource.setContentService( contentService );
        resource.setContentTypeService( contentTypeService );
        resource.setProjectService( projectService );
        resource.setLocaleService( localeService );

        this.mockRequest = mock( HttpServletRequest.class );
        when( mockRequest.getServerName() ).thenReturn( "localhost" );
        when( mockRequest.getScheme() ).thenReturn( "http" );
        when( mockRequest.getServerPort() ).thenReturn( 80 );
        when( mockRequest.getLocales() ).thenReturn( Collections.enumeration( Collections.singleton( Locale.US ) ) );
        ResteasyContext.getContextDataMap().put( HttpServletRequest.class, mockRequest );

        final MessageBundle messageBundle = mock( MessageBundle.class );
        when( localeService.getBundle( any(), any() ) ).thenReturn( messageBundle );

        return resource;
    }

    private Content createContent()
    {
        return Content.create().
            id( ContentId.from( "content-id" ) ).
            type( ContentTypeName.folder() ).
            displayName( "Content display name" ).
            name( "content-name" ).
            path( "/path/to/content" ).
            build();
    }

    private Answer<IssueNotificationParams> returnNotificationParams()
    {
        return invocation -> IssueNotificationParams.create().build();
    }

    private static Context createRepoContext()
    {
        return ContextBuilder.from( ContextAccessor.current() )
            .repositoryId( "com.enonic.cms.myproject" )
            .branch( ContentConstants.BRANCH_DRAFT )
            .build();
    }

    @Test
    public void test_create()
    {
        createRepoContext().runWith( () -> {
            final CreateIssueJson params =
                new CreateIssueJson( null, "title", "desc", Arrays.asList( User.anonymous().getKey().toString() ), createPublishRequest(),
                                     null );

            final Issue issue = this.createIssue();
            final IssueComment comment = IssueComment.create().text( issue.getDescription() ).creator( issue.getCreator() ).build();
            final IssueResource issueResource = getResourceInstance();
            final ArgumentCaptor<CreateIssueCommentParams> commentCaptor = ArgumentCaptor.forClass( CreateIssueCommentParams.class );

            when( issueService.create( any( CreateIssueParams.class ) ) ).thenReturn( issue );
            when( issueService.createComment( any( CreateIssueCommentParams.class ) ) ).thenReturn( comment );

            issueResource.create( params, mockRequest );

            verify( issueService ).createComment( commentCaptor.capture() );
            verify( issueService, times( 1 ) ).create( any( CreateIssueParams.class ) );
            verify( issueService, times( 1 ) ).createComment( any( CreateIssueCommentParams.class ) );
            verify( issueNotificationsSender, times( 1 ) )
                .notifyIssueCreated( isA( IssueNotificationParams.class ) );

            assertEquals( "desc", commentCaptor.getValue().getText() );
            assertEquals( issue.getId(), commentCaptor.getValue().getIssue() );
            assertEquals( issue.getCreator(), commentCaptor.getValue().getCreator() );
        });
    }

    @Test
    public void test_create_with_publish_schedule()
    {
        createRepoContext().runWith( () -> {
            final CreateIssueJson params = new CreateIssueJson( IssueType.PUBLISH_REQUEST.toString(), "title", "desc",
                                                                Arrays.asList( User.anonymous().getKey().toString() ),
                                                                createPublishRequest(),
                                                                createPublishRequestSchedule() );

            final Issue issue = this.createPublishRequestIssue();
            final IssueComment comment = IssueComment.create().text( issue.getDescription() ).creator( issue.getCreator() ).build();
            final IssueResource issueResource = getResourceInstance();
            final ArgumentCaptor<CreateIssueCommentParams> commentCaptor = ArgumentCaptor.forClass( CreateIssueCommentParams.class );
            final ArgumentCaptor<CreateIssueParams> paramCaptor = ArgumentCaptor.forClass( CreateIssueParams.class );

            when( issueService.create( any( CreateIssueParams.class ) ) ).thenReturn( issue );
            when( issueService.createComment( any( CreateIssueCommentParams.class ) ) ).thenReturn( comment );

            issueResource.create( params, mockRequest );

            verify( issueService ).createComment( commentCaptor.capture() );
            verify( issueService, times( 1 ) ).create( paramCaptor.capture() );
            verify( issueService, times( 1 ) ).createComment( any( CreateIssueCommentParams.class ) );
            verify( issueNotificationsSender, times( 1 ) )
                .notifyIssueCreated( isA( IssueNotificationParams.class ) );

            assertEquals( "desc", commentCaptor.getValue().getText() );
            assertEquals( issue.getId(), commentCaptor.getValue().getIssue() );
            assertEquals( issue.getCreator(), commentCaptor.getValue().getCreator() );
            assertTrue( paramCaptor.getValue() instanceof CreatePublishRequestIssueParams );
            assertEquals( params.schedule.getFrom(), ( (CreatePublishRequestIssueParams) paramCaptor.getValue() ).getSchedule().getFrom() );
            assertEquals( params.schedule.getTo(), ( (CreatePublishRequestIssueParams) paramCaptor.getValue() ).getSchedule().getTo() );
        });
    }

    @Test
    public void test_createNoDescription()
    {
        createRepoContext().runWith( () -> {
            final CreateIssueJson params =
                new CreateIssueJson( null, "title", null, Arrays.asList( User.anonymous().getKey().toString() ), createPublishRequest(),
                                     null );

            final Issue issue = this.createIssue();
            final IssueResource issueResource = getResourceInstance();

            when( issueService.create( any( CreateIssueParams.class ) ) ).thenReturn( issue );

            issueResource.create( params, mockRequest );

            verify( issueService, times( 1 ) ).create( any( CreateIssueParams.class ) );
            verify( issueService, never() ).createComment( any( CreateIssueCommentParams.class ) );
            verify( issueNotificationsSender, times( 1 ) )
                .notifyIssueCreated( isA( IssueNotificationParams.class ) );
        });
    }

    @Test
    public void verifyAdminNotFiltered()
    {
        createRepoContext().runWith( () -> {
            verifyValidAssigneeNotFiltered( PrincipalKeys.from( RoleKeys.ADMIN ) );
        });
    }



    @Test
    public void verifyContentManagerAdminNotFiltered()
    {
        createRepoContext().runWith( () -> {
            verifyValidAssigneeNotFiltered( PrincipalKeys.from( RoleKeys.CONTENT_MANAGER_ADMIN ) );
        });
    }

    @Test
    public void verifyContentManagerExpertNotFiltered()
    {
        createRepoContext().runWith( () -> {
            verifyValidAssigneeNotFiltered( PrincipalKeys.from( RoleKeys.CONTENT_MANAGER_EXPERT ) );
        });
    }

    @Test
    public void verifyContentManagerNotFiltered()
        throws Exception
    {
        createRepoContext().runWith( () -> {
            verifyValidAssigneeNotFiltered( PrincipalKeys.from( RoleKeys.CONTENT_MANAGER_APP ) );
        });
    }

    @Test
    public void verifyProjectOwnerNotFiltered()
        throws Exception
    {
        ContextBuilder.from( ContextAccessor.current() )
            .repositoryId( ProjectName.from( "test-project" ).getRepoId() )
            .build()
            .runWith( () -> {
                try
                {
                    verifyValidAssigneeNotFiltered( createKeyForUserOwner(),
                                                    PrincipalKeys.from( PrincipalKey.ofRole( "cms.project.test-project.owner" ) ) );
                }
                catch ( Exception e )
                {
                    throw new RuntimeException( e );
                }
            } );
    }

    @Test
    public void verifyProjectEditorNotFiltered()
        throws Exception
    {
        ContextBuilder.from( ContextAccessor.current() )
            .repositoryId( ProjectName.from( "test-project" ).getRepoId() )
            .build()
            .runWith( () -> {
                try
                {
                    verifyValidAssigneeNotFiltered( createKeyForUserEditor(),
                                                    PrincipalKeys.from( PrincipalKey.ofRole( "cms.project.test-project.editor" ) ) );
                }
                catch ( Exception e )
                {
                    throw new RuntimeException( e );
                }
            } );
    }

    @Test
    public void verifyUserInOwnerGroup()
        throws Exception
    {
        final PrincipalKey userInGroup = PrincipalKey.ofUser( IdProviderKey.system(), "user-in-owner-group" );

        ContextBuilder.from( ContextAccessor.current() )
            .repositoryId( ProjectName.from( "test-project" ).getRepoId() )
            .build()
            .runWith( () -> {
                try
                {
                    verifyValidAssigneeNotFiltered( userInGroup,
                                                    PrincipalKeys.from( PrincipalKey.ofRole( "cms.project.test-project.owner" ),
                                                                        createKeyForGroupOwner() ) );
                }
                catch ( Exception e )
                {
                    throw new RuntimeException( e );
                }
            } );
    }

    private void verifyValidAssigneeNotFiltered( final PrincipalKeys memberships )
    {
        verifyValidAssigneeNotFiltered( User.anonymous().getKey(), memberships );
    }

    private void verifyValidAssigneeNotFiltered( final PrincipalKey user )
    {
        verifyValidAssigneeNotFiltered( user, PrincipalKeys.empty() );
    }

    private void verifyValidAssigneeNotFiltered( final PrincipalKey user, PrincipalKeys memberships )
    {
        final CreateIssueJson params =
            new CreateIssueJson( null, "title", "", Arrays.asList( user.toString() ), createPublishRequest(), null );

        final IssueResource issueResource = getResourceInstance();
        when( issueService.create( isA( CreateIssueParams.class ) ) ).thenReturn( this.createIssue() );
        when( securityService.getAllMemberships( isA( PrincipalKey.class ) ) ).thenReturn( memberships );

        ArgumentCaptor<CreateIssueParams> issueParamsArgumentCaptor = ArgumentCaptor.forClass( CreateIssueParams.class );

        issueResource.create( params, this.mockRequest );

        verify( issueService ).create( issueParamsArgumentCaptor.capture() );
        assertTrue( issueParamsArgumentCaptor.getValue().getApproverIds().isNotEmpty() );
    }

    @Test
    public void verifyInvalidAssigneeFiltered()
    {
        createRepoContext().runWith( () -> {
            final CreateIssueJson params =
                new CreateIssueJson( null, "title", "", Arrays.asList( User.anonymous().getKey().toString() ), createPublishRequest(),
                                     null );

            final IssueResource issueResource = getResourceInstance();
            ArgumentCaptor<CreateIssueParams> issueParamsArgumentCaptor = ArgumentCaptor.forClass( CreateIssueParams.class );
            when( issueService.create( isA( CreateIssueParams.class ) ) ).thenReturn( this.createIssue() );

            issueResource.create( params, mockRequest );

            verify( issueService ).create( issueParamsArgumentCaptor.capture() );

            assertTrue( issueParamsArgumentCaptor.getValue().getApproverIds().isEmpty() );
        });
    }

    @Test
    public void test_getStats()
        throws Exception
    {
        createLocalSession();
        final FindIssuesResult findIssuesResult = FindIssuesResult.create().totalHits( 4 ).build();
        final IssueResource issueResource = getResourceInstance();
        when( issueService.findIssues( any( IssueQuery.class ) ) ).thenReturn( findIssuesResult );
        final IssueStatsJson result = issueResource.getStats();

        assertNotNull( result );
        verify( issueService, times( 6 ) ).findIssues( any( IssueQuery.class ) );
    }

    @Test
    public void test_getStatsByType()
        throws Exception
    {
        createLocalSession();
        final FindIssuesResult findIssuesResult = FindIssuesResult.create().totalHits( 4 ).build();
        final IssueResource issueResource = getResourceInstance();
        when( issueService.findIssues( any( IssueQuery.class ) ) ).thenReturn( findIssuesResult );
        final IssueStatsJson result = issueResource.getStatsByType( new CountStatsJson( "STANDARD" ) );

        assertNotNull( result );
        verify( issueService, times( 6 ) ).findIssues( any( IssueQuery.class ) );
    }

    @Test
    public void test_list_issues()
        throws Exception
    {
        createLocalSession();

        final Issue issue = createIssue();
        final List<Issue> issues = List.of( issue );
        final IssueResource issueResource = getResourceInstance();
        final FindIssuesResult result = FindIssuesResult.create().totalHits( 4 ).issues( issues ).build();
        when( issueService.findIssues( any( IssueQuery.class ) ) ).thenReturn( result );
        when( securityService.getUser( any( PrincipalKey.class ) ) ).thenReturn( Optional.empty() );

        issueResource.listIssues( new ListIssuesJson( "OPEN", true, true, true, 0, 10 ) );

        verify( issueService, times( 1 ) ).findIssues( any( IssueQuery.class ) );
    }

    @Test
    public void test_find_issues()
        throws Exception
    {
        createLocalSession();

        final FindIssuesResult result = FindIssuesResult.create().totalHits( 4 ).issues( List.of( createIssue() ) ).build();

        when( issueService.findIssues( any( IssueQuery.class ) ) ).thenReturn( result );
        when( securityService.getUser( any( PrincipalKey.class ) ) ).thenReturn( Optional.empty() );

        request().path( "issue/findIssues" ).entity( "{}", MediaType.APPLICATION_JSON_TYPE ).post().getAsString();

        verify( issueService, times( 1 ) ).findIssues( any( IssueQuery.class ) );
    }

    @Test
    public void test_getIssue()
        throws Exception
    {
        final Instant createdTime = Instant.now();
        final Issue issue = createIssue();

        when( this.issueService.getIssue( issue.getId() ) ).thenReturn( issue );
        List<IssueComment> comments = List.of( this.createIssueComment( createdTime ) );
        FindIssueCommentsResult result = FindIssueCommentsResult.create().totalHits( 3 ).comments( comments ).build();
        when( this.issueService.findComments( any( IssueCommentQuery.class ) ) ).thenReturn( result );

        final Map<String, String> params = Map.of( "id", issue.getId().toString() );
        final String expected = Interpolator.classic().interpolate( readFromFile( "get_issue_result.json" ), params::get );

        String jsonString = request().path( "issue/id" ).
            queryParam( "id", issue.getId().toString() ).
            get().getAsString();

        assertStringJson( expected, jsonString );
    }

    @Test
    public void test_get_publish_schedule_issue()
        throws Exception
    {
        final Instant createdTime = Instant.now();
        final Issue issue = createPublishRequestIssue();

        when( this.issueService.getIssue( issue.getId() ) ).thenReturn( issue );
        List<IssueComment> comments = List.of( this.createIssueComment( createdTime ) );
        FindIssueCommentsResult result = FindIssueCommentsResult.create().totalHits( 3 ).comments( comments ).build();
        when( this.issueService.findComments( any( IssueCommentQuery.class ) ) ).thenReturn( result );

        final Map<String, String> params = Map.of( "id", issue.getId().toString() );
        final String expected = Interpolator.classic().interpolate( readFromFile( "get_issue_scheduled_result.json" ), params::get );

        String jsonString = request().path( "issue/id" ).
            queryParam( "id", issue.getId().toString() ).
            get().getAsString();

        assertStringJson( expected, jsonString );
    }

    @Test
    public void test_getIssues()
        throws Exception
    {
        final Issue issue = createIssue();

        when( this.issueService.getIssue( issue.getId() ) ).thenReturn( issue );
        when( this.issueService.findComments( any( IssueCommentQuery.class ) ) )
            .thenReturn( FindIssueCommentsResult.create().build() );

        final Map<String, String> params = Map.of( "id", issue.getId().toString() );
        final String expected = Interpolator.classic().interpolate( readFromFile( "get_issues_result.json" ), params::get );

        String jsonString = request().path( "issue/getIssues" ).
            entity( "{\"ids\":[\"" + issue.getId() + "\"]}", MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertStringJson( expected, jsonString );
    }

    @Test
    public void test_update()
    {
        createRepoContext().runWith( () -> {

            final Issue issue = createIssue();
            final User admin = User.create()
                .key( PrincipalKey.from( "user:system:admin" ) )
                .login( "admin" )
                .displayName( "Admin" )
                .email( "admin@email.com" )
                .build();
            final UpdateIssueJson params =
                new UpdateIssueJson( issue.getId().toString(), "title", "desc", "Open", false, false, Arrays.asList( "user:system:admin" ),
                                     createPublishRequest(), null );

            IssueResource resource = getResourceInstance();
            when( issueService.getIssue( isA( IssueId.class ) ) ).thenReturn( issue );
            when( issueService.update( any( UpdateIssueParams.class ) ) ).thenReturn( issue );
            when( issueService.findComments( any( IssueCommentQuery.class ) ) )
                .thenReturn( FindIssueCommentsResult.create().build() );
            when( securityService.getUser( PrincipalKey.from( "user:system:admin" ) ) ).thenReturn( Optional.of( admin ) );

            resource.update( params, mockRequest );

            verify( issueService, times( 1 ) ).update( any( UpdateIssueParams.class ) );
            verify( issueNotificationsSender, times( 1 ) )
                .notifyIssueUpdated( isA( IssueUpdatedNotificationParams.class ) );
        });
    }

    @Test
    public void test_update_with_publish_schedule()
    {
        createRepoContext().runWith( () -> {
            final Issue issue = createPublishRequestIssue();
            final User admin = User.create()
                .key( PrincipalKey.from( "user:system:admin" ) )
                .login( "admin" )
                .displayName( "Admin" )
                .email( "admin@email.com" )
                .build();
            final UpdateIssueJson params =
                new UpdateIssueJson( issue.getId().toString(), "title", "desc", "Open", false, false, Arrays.asList( "user:system:admin" ),
                                     createPublishRequest(), createPublishRequestSchedule() );

            IssueResource resource = getResourceInstance();
            when( issueService.getIssue( isA( IssueId.class ) ) ).thenReturn( issue );
            when( issueService.update( any( UpdateIssueParams.class ) ) ).thenReturn( issue );
            when( issueService.findComments( any( IssueCommentQuery.class ) ) )
                .thenReturn( FindIssueCommentsResult.create().build() );
            when( securityService.getUser( PrincipalKey.from( "user:system:admin" ) ) ).thenReturn( Optional.of( admin ) );

            resource.update( params, mockRequest );

            verify( issueService, times( 1 ) ).update( any( UpdateIssueParams.class ) );
            verify( issueNotificationsSender, times( 1 ) )
                .notifyIssueUpdated( isA( IssueUpdatedNotificationParams.class ) );
        });
    }

    @Test
    public void test_update_is_publish()
    {
        final Issue issue = createIssue();

        final UpdateIssueJson params =
            new UpdateIssueJson( issue.getId().toString(), "title", "desc", "Closed", true, false, null, createPublishRequest(), null );

        IssueResource resource = getResourceInstance();
        when( issueService.getIssue( isA( IssueId.class ) ) ).thenReturn( issue );
        when( issueService.update( any( UpdateIssueParams.class ) ) ).thenReturn( issue );
        when( issueService.findComments( any( IssueCommentQuery.class ) ) )
            .thenReturn( FindIssueCommentsResult.create().build() );

        resource.update( params, mockRequest );

        verify( issueService, times( 1 ) ).update( any( UpdateIssueParams.class ) );
        verify( issueNotificationsSender, times( 1 ) )
            .notifyIssuePublished( isA( IssuePublishedNotificationParams.class ) );
    }

    @Test
    public void test_update_is_autoSave()
    {
        createRepoContext().runWith( () -> {

            final Issue issue = createIssue();
            final User admin = User.create()
                .key( PrincipalKey.from( "user:system:admin" ) )
                .login( "admin" )
                .displayName( "Admin" )
                .email( "admin@email.com" )
                .build();
            final UpdateIssueJson params =
                new UpdateIssueJson( issue.getId().toString(), "title", "desc", "Closed", true, true, Arrays.asList( "user:system:admin" ),
                                     createPublishRequest(), null );

            IssueResource resource = getResourceInstance();
            when( issueService.getIssue( isA( IssueId.class ) ) ).thenReturn( issue );
            when( issueService.update( any( UpdateIssueParams.class ) ) ).thenReturn( issue );
            when( issueService.findComments( any( IssueCommentQuery.class ) ) )
                .thenReturn( FindIssueCommentsResult.create().build() );
            when( securityService.getUser( PrincipalKey.from( "user:system:admin" ) ) ).thenReturn( Optional.of( admin ) );

            resource.update( params, mock( HttpServletRequest.class ) );

            verify( issueService, times( 1 ) ).update( any( UpdateIssueParams.class ) );
            verify( issueNotificationsSender, times( 0 ) )
                .notifyIssueUpdated( isA( IssueUpdatedNotificationParams.class ) );
            verify( issueNotificationsSender, times( 0 ) )
                .notifyIssuePublished( isA( IssuePublishedNotificationParams.class ) );
        });
    }

    @Test
    public void test_comment()
    {
        final Issue issue = createIssue();
        final IssueComment comment = createIssueComment( Instant.now() );
        final User creator = User.anonymous();

        final CreateIssueCommentJson params =
            new CreateIssueCommentJson( issue.getId().toString(), comment.getText(), comment.getCreator().toString(), false );

        IssueResource resource = getResourceInstance();
        when( securityService.getUser( params.creator ) ).thenReturn( Optional.ofNullable( creator ) );
        when( issueService.getIssue( params.issueId ) ).thenReturn( issue );
        when( issueService.createComment( any( CreateIssueCommentParams.class ) ) ).thenReturn( comment );
        when( issueService.findComments( any( IssueCommentQuery.class ) ) )
            .thenReturn( FindIssueCommentsResult.create().build() );

        resource.comment( params, mockRequest );

        verify( issueService, times( 1 ) ).createComment( any( CreateIssueCommentParams.class ) );
        verify( issueNotificationsSender, times( 1 ) )
            .notifyIssueCommented( isA( IssueCommentedNotificationParams.class ) );
    }

    @Test
    public void test_commentNoUser()
    {
        final Issue issue = createIssue();
        final IssueComment comment = createIssueComment( Instant.now() );

        final CreateIssueCommentJson params =
            new CreateIssueCommentJson( issue.getId().toString(), comment.getText(), comment.getCreator().toString(), false );

        IssueResource resource = getResourceInstance();
        when( issueService.getIssue( params.issueId ) ).thenReturn( issue );
        when( securityService.getUser( params.creator ) ).thenReturn( Optional.empty() );

        assertThrows( PrincipalNotFoundException.class, () -> resource.comment( params, mock( HttpServletRequest.class ) ) );
    }

    @Test
    public void test_commentNoIssue()
    {
        final Issue issue = createIssue();
        final IssueComment comment = createIssueComment( Instant.now() );

        final CreateIssueCommentJson params =
            new CreateIssueCommentJson( issue.getId().toString(), comment.getText(), comment.getCreator().toString(), false );

        IssueResource resource = getResourceInstance();
        when( issueService.getIssue( params.issueId ) ).thenThrow( new IssueNotFoundException( issue.getId() ) );
        when( securityService.getUser( params.creator ) ).thenReturn( Optional.of( User.anonymous() ) );

        assertThrows( IssueNotFoundException.class, () -> resource.comment( params, mock( HttpServletRequest.class ) ) );
    }

    @Test
    public void test_getComments()
        throws Exception
    {
        final Issue issue = createIssue();
        final IssueComment comment = createIssueComment( Instant.now() );

        FindIssueCommentsResult result = FindIssueCommentsResult.create().comments( List.of( comment ) ).totalHits( 10 ).build();

        when( this.issueService.findComments( any( IssueCommentQuery.class ) ) ).thenReturn( result );

        final Map<String, String> params = Map.of( "createdTime", comment.getCreated().toString(), "id", comment.getId().toString() );
        final String expected = Interpolator.classic().interpolate( readFromFile( "get_issue_comments_result.json" ), params::get );

        String jsonString = request().path( "issue/comment/list" ).
            entity( "{\"issue\":\"" + issue.getName() + "\"}", MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertStringJson( expected, jsonString );
    }

    @Test
    public void test_updateComment()
    {
        final IssueComment comment = createIssueComment( Instant.now() );

        final UpdateIssueCommentJson params = new UpdateIssueCommentJson( comment.getId().toString(), comment.getText() );

        IssueResource resource = getResourceInstance();
        when( issueService.updateComment( any( UpdateIssueCommentParams.class ) ) ).thenReturn( comment );

        IssueCommentJson json = resource.updateComment( params );

        assertEquals( json.getText(), comment.getText() );
        verify( issueService, times( 1 ) ).updateComment( any( UpdateIssueCommentParams.class ) );
    }

    @Test
    public void test_deleteComment()
        throws Exception
    {
        final IssueComment comment = createIssueComment( Instant.now() );
        IssueResource resource = getResourceInstance();

        DeleteIssueCommentResult result = new DeleteIssueCommentResult( NodeIds.from( comment.getId() ) );
        when( this.issueService.deleteComment( any( DeleteIssueCommentParams.class ) ) ).thenReturn( result );

        DeleteIssueCommentJson params = new DeleteIssueCommentJson( comment.getId().toString() );
        DeleteIssueCommentResultJson resultJson = resource.deleteComment( params );

        assertEquals( 1, resultJson.getIds().size() );
        assertEquals( comment.getId().toString(), resultJson.getIds().get( 0 ) );
    }

    private PublishRequestJson createPublishRequest()
    {
        final PublishRequestItemJson publishRequestItemJson = new PublishRequestItemJson( PublishRequestItem.create().
            includeChildren( true ).
            id( ContentId.from( "content-id" ) ).build() );

        final PublishRequestJson publishRequestJson = new PublishRequestJson();

        publishRequestJson.setItems( new HashSet( Arrays.asList( publishRequestItemJson ) ) );
        publishRequestJson.setExcludeIds( new HashSet( Arrays.asList( "exclude-id" ) ) );
        return publishRequestJson;
    }

    private PublishRequestScheduleJson createPublishRequestSchedule()
    {
        return new PublishRequestScheduleJson( Instant.ofEpochSecond( 1549016358L ).toString(),
                                               Instant.ofEpochSecond( 1570000758L ).toString() );
    }

    private IssueComment createIssueComment( Instant createdTime )
    {
        return IssueComment.create().
            id( NodeId.from( UUID.randomUUID() ) ).
            text( "Comment text one" ).creator( User.anonymous().getKey() ).
            creatorDisplayName( "Anonymous" ).
            created( createdTime ).
            build();

    }

    private Issue createIssue()
    {
        return Issue.create().
            addApproverId( PrincipalKey.from( "user:system:anonymous" ) ).
            title( "title" ).
            description( "desc" ).creator( User.anonymous().getKey() ).modifier( User.anonymous().getKey() ).
            setPublishRequest( PublishRequest.create().
                addExcludeId( ContentId.from( "exclude-id" ) ).
                addItem( PublishRequestItem.create().
                    id( ContentId.from( "content-id" ) ).
                    includeChildren( true ).
                    build() ).
                build() ).
            build();

    }

    private Issue createPublishRequestIssue()
    {
        return PublishRequestIssue.create().
            addApproverId( PrincipalKey.from( "user:system:anonymous" ) ).
            title( "title" ).
            description( "desc" ).creator( User.anonymous().getKey() ).modifier( User.anonymous().getKey() ).
            setPublishRequest( PublishRequest.create().
                addExcludeId( ContentId.from( "exclude-id" ) ).
                addItem( PublishRequestItem.create().
                    id( ContentId.from( "content-id" ) ).
                    includeChildren( true ).
                    build() ).
                build() ).
            schedule( createPublishRequestSchedule().toSchedule() ).
            build();

    }

    private void createLocalSession()
    {
        final User user = User.create().
            key( PrincipalKey.ofUser( IdProviderKey.system(), "user1" ) ).
            displayName( "User 1" ).
            email( "user1@enonic.com" ).
            login( "user1" ).
            build();

        final LocalScope localScope = ContextAccessor.current().getLocalScope();
        final AuthenticationInfo authInfo = AuthenticationInfo.create().user( user ).principals( RoleKeys.ADMIN ).build();
        localScope.setAttribute( authInfo );
        localScope.setSession( new SessionMock() );
    }

    private ProjectPermissions createProjectPermissions()
    {
        return ProjectPermissions.create()
            .addEditor( createKeyForUserEditor() )
            .addOwner( createKeyForGroupOwner() )
            .addOwner( createKeyForUserOwner() )
            .build();
    }

    private PrincipalKey createKeyForUserEditor()
    {
        return PrincipalKey.ofUser( IdProviderKey.system(), "userEditor" );
    }

    private PrincipalKey createKeyForUserOwner()
    {
        return PrincipalKey.ofUser( IdProviderKey.system(), "userOwner" );
    }

    private PrincipalKey createKeyForGroupOwner()
    {
        return PrincipalKey.ofGroup( IdProviderKey.system(), "groupOwner" );
    }
}
