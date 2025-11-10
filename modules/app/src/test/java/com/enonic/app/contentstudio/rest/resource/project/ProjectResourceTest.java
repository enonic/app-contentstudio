package com.enonic.app.contentstudio.rest.resource.project;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.google.common.collect.Lists;
import com.google.common.io.ByteSource;

import jakarta.ws.rs.core.MediaType;

import com.enonic.app.contentstudio.rest.AdminRestConfig;
import com.enonic.app.contentstudio.rest.resource.AdminResourceTestSupport;
import com.enonic.app.contentstudio.rest.resource.content.task.ApplyPermissionsRunnableTask;
import com.enonic.app.contentstudio.rest.resource.content.task.ProjectsSyncTask;
import com.enonic.xp.attachment.Attachment;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentEditor;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentName;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.EditableContent;
import com.enonic.xp.content.ExtraDatas;
import com.enonic.xp.content.SyncContentService;
import com.enonic.xp.content.UpdateContentParams;
import com.enonic.xp.data.PropertyTree;
import com.enonic.xp.jaxrs.impl.MockRestResponse;
import com.enonic.xp.project.CreateProjectParams;
import com.enonic.xp.project.ModifyProjectIconParams;
import com.enonic.xp.project.ModifyProjectParams;
import com.enonic.xp.project.Project;
import com.enonic.xp.project.ProjectGraph;
import com.enonic.xp.project.ProjectGraphEntry;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.project.ProjectPermissions;
import com.enonic.xp.project.ProjectService;
import com.enonic.xp.project.Projects;
import com.enonic.xp.security.PrincipalKey;
import com.enonic.xp.security.RoleKeys;
import com.enonic.xp.security.acl.AccessControlEntry;
import com.enonic.xp.security.acl.AccessControlList;
import com.enonic.xp.security.acl.Permission;
import com.enonic.xp.task.SubmitLocalTaskParams;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;
import com.enonic.xp.web.HttpStatus;
import com.enonic.xp.web.multipart.MultipartForm;
import com.enonic.xp.web.multipart.MultipartItem;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class ProjectResourceTest
    extends AdminResourceTestSupport
{
    private ProjectService projectService;

    private ContentService contentService;

    private TaskService taskService;

    private ProjectResource resource;

    @Override
    protected ProjectResource getResourceInstance()
    {
        projectService = mock( ProjectService.class );
        contentService = mock( ContentService.class );
        taskService = mock( TaskService.class );
        final SyncContentService syncContentService = mock( SyncContentService.class );

        resource = new ProjectResource();
        resource.setProjectService( projectService );
        resource.setContentService( contentService );
        resource.setTaskService( taskService );
        resource.setSyncContentService( syncContentService );
        resource.activate( mock( AdminRestConfig.class, invocation -> invocation.getMethod().getDefaultValue() ),
                           mock( ProjectConfig.class, invocation -> invocation.getMethod().getDefaultValue() ) );
        return resource;
    }

    @Test
    public void get_project()
        throws Exception
    {
        final Project project = createProject( "project1", "project name", "project description", Attachment.create().
            name( "logo.png" ).
            mimeType( "image/png" ).
            label( "small" ).
            build() );

        when( projectService.get( project.getName() ) ).thenReturn( project );

        mockProjectPermissions( project.getName() );
        mockRootContent();

        final String jsonString = request().
            path( "project/get" ).
            queryParam( "name", project.getName().toString() ).
            get().
            getAsString();

        assertJson( "get_project.json", jsonString );
    }

    @Test
    public void list_projects()
        throws Exception
    {
        final Project project1 = createProject( "project1", "project name 1", "project description 1", Attachment.create().
            name( "logo.png" ).
            mimeType( "image/png" ).
            label( "small" ).
            build() );

        final Project project2 = createProject( "project2", "project2", null, null, "parent1" );
        final Project project3 = createProject( "project3", "project3", null, null );
        final Project project4 = createProject( "project4", "project4", null, null, "parent2" );

        mockRootContent();

        when( projectService.list() )
            .thenReturn( Projects.create().addAll( List.of( project1, project2, project3, project4 ) ).build() );

        when( projectService.getPermissions( ProjectName.from( "project1" ) ) ).
            thenReturn( ProjectPermissions.create().addOwner( PrincipalKey.from( "user:system:owner" ) ).build() );

        when( projectService.getPermissions( ProjectName.from( "project2" ) ) ).
            thenReturn( ProjectPermissions.create().addEditor( PrincipalKey.from( "user:system:editor" ) ).build() );

        when( projectService.getPermissions( ProjectName.from( "project3" ) ) ).
            thenReturn( ProjectPermissions.create().addAuthor( PrincipalKey.from( "user:system:author" ) ).build() );

        when( projectService.getPermissions( ProjectName.from( "project4" ) ) ).
            thenReturn( ProjectPermissions.create().
                addContributor( PrincipalKey.from( "user:system:contributor" ) ).
                addViewer( PrincipalKey.from( "user:system:custom" ) ).
                build() );

        String jsonString = request().path( "project/list" ).get().getAsString();

        assertJson( "list_projects.json", jsonString );
    }

    @Test
    public void list_projects_with_missing()
        throws Exception
    {
        final Project project1 = createProject( "project1", "project name 1", "project description 1", Attachment.create().
            name( "logo.png" ).
            mimeType( "image/png" ).
            label( "small" ).
            build() );

        final Project project2 = createProject( "project2", "project2", null, null, "project1" );
        final Project project3 = createProject( "project3", "project3", null, null, "project2" );
        final Project project4 = createProject( "project4", "project4", null, null, "project3" );
        final Project project5 = createProject( "project5", "project5", null, null, "project4" );


        mockRootContent();

        when( projectService.list() )
            .thenReturn( Projects.create().addAll( List.of( project1, project4, project5 ) ).build() )
            .thenReturn( Projects.create().addAll( List.of( project1, project2, project3, project4, project5 ) ).build() );

        when( projectService.getPermissions( ProjectName.from( "project1" ) ) ).
            thenReturn( ProjectPermissions.create().addOwner( PrincipalKey.from( "user:system:owner" ) ).build() );

        when( projectService.getPermissions( ProjectName.from( "project4" ) ) ).
            thenReturn( ProjectPermissions.create().
            addContributor( PrincipalKey.from( "user:system:contributor" ) ).
            addViewer( PrincipalKey.from( "user:system:custom" ) ).
            build() );

        when( projectService.getPermissions( ProjectName.from( "project5" ) ) ).
            thenReturn( ProjectPermissions.create().addAuthor( PrincipalKey.from( "user:system:author" ) ).build() );

        String jsonString = request().path( "project/list" ).queryParam( "resolveUnavailable", "true" ).get().getAsString();

        assertJson( "list_projects_with_missing.json", jsonString );
    }

    @Test
    public void getTree()
        throws Exception
    {
        final Project project1 = createProject( "project1", null );
        final Project project2 = createProject( "project2", "project1" );
        final Project project3 = createProject( "project3", "project2" );

        when( projectService.graph( project1.getName() ) ).thenReturn( ProjectGraph.create().
            add( ProjectGraphEntry.create().
                name( project1.getName() ).
                build() ).
            add( ProjectGraphEntry.create().
                name( project2.getName() ).
                parent( project1.getName() ).
                build() ).
            add( ProjectGraphEntry.create().
                name( project3.getName() ).
                parent( project2.getName() ).
                build() ).
            build() );

        assertJson( "project_tree.json",
                    request().path( "project/getTree" ).queryParam( "name", project1.getName().toString() ).get().getAsString() );
    }

    @Test
    public void fetch_projects_by_content_id()
        throws Exception
    {
        final Project project1 = createProject( "project1", "project name 1", "project description 1", null, "base" );

        final Project project2 = createProject( "project2", "project2", null, null, "parent1" );
        final Project project3 = createProject( "project3", null, null, null );
        final Project project4 = createProject( "project4", "project4", null, null, "parent2" );

        mockRootContent();

        when( projectService.list() )
            .thenReturn( Projects.create().addAll( List.of( project1, project2, project3, project4 ) ).build() );

        when( contentService.contentExists( ContentId.from( "123" ) ) ).
            thenReturn( true ).
            thenReturn( false ).
            thenReturn( true ).
            thenReturn( false );

        when( projectService.getPermissions( ProjectName.from( "project1" ) ) ).
            thenReturn( ProjectPermissions.create().addOwner( PrincipalKey.from( "user:system:owner" ) ).build() );

        when( projectService.getPermissions( ProjectName.from( "project2" ) ) ).
            thenReturn( ProjectPermissions.create().addEditor( PrincipalKey.from( "user:system:editor" ) ).build() );

        when( projectService.getPermissions( ProjectName.from( "project3" ) ) ).
            thenReturn( ProjectPermissions.create().addAuthor( PrincipalKey.from( "user:system:author" ) ).build() );

        when( projectService.getPermissions( ProjectName.from( "project4" ) ) ).
            thenReturn( ProjectPermissions.create().addAuthor( PrincipalKey.from( "user:system:contributor" ) ).build() );

        final String jsonString = request().path( "project/fetchByContentId" ).
            queryParam( "contentId", "123" ).
            get().
            getAsString();

        assertJson( "fetch_by_content_id_projects.json", jsonString );
    }

    @Test
    public void create_project_exception()
        throws Exception
    {
        IllegalArgumentException e = new IllegalArgumentException( "Exception occured." );
        when( projectService.create( isA( CreateProjectParams.class ) ) ).thenThrow( e );

        final MockRestResponse get = request().path( "project/create" ).
            entity( readFromFile( "create_project_params.json" ), MediaType.APPLICATION_JSON_TYPE ).
            post();

        assertEquals( 500, get.getStatus() );
        assertEquals( "Exception occured.", get.getAsString() );
    }

    @Test
    public void create_project_success()
        throws Exception
    {
        final Project project = createProject( "project1", "project name 1", "project description 1", Attachment.create().
            name( "logo.png" ).
            mimeType( "image/png" ).
            label( "small" ).
            build() );

        mockRootContent();
        when( projectService.create( isA( CreateProjectParams.class ) ) ).thenReturn( project );
        when( projectService.modifyPermissions( eq( project.getName() ), isA( ProjectPermissions.class ) ) ).
            thenAnswer( i -> i.getArguments()[1] );

        mockProjectPermissions( project.getName() );

        String jsonString = request().path( "project/create" ).
            entity( readFromFile( "create_project_params.json" ), MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertJson( "create_project_success.json", jsonString );
    }

    @Test
    public void create_project_with_publicReadAccess()
        throws Exception
    {
        final Project project = createProject( "project1", "project name 1", "project description 1", Attachment.create().
            name( "logo.png" ).
            mimeType( "image/png" ).
            label( "small" ).
            build() );

        final Content contentRoot = Content.create().id( ContentId.from( "123" ) ).
            name( ContentName.from( "root" ) ).
            parentPath( ContentPath.ROOT ).
            permissions( AccessControlList.create().add(
                AccessControlEntry.create().principal( RoleKeys.ADMIN ).allowAll().build() ).add(
                AccessControlEntry.create().principal( RoleKeys.EVERYONE ).allow( Permission.READ ).build() ).build() ).
            language( Locale.ENGLISH ).
            data( new PropertyTree() ).
            extraDatas( ExtraDatas.empty() ).
            build();

        when( contentService.getByPath( ContentPath.ROOT ) ).thenReturn( contentRoot );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( contentRoot );

        when( projectService.create( isA( CreateProjectParams.class ) ) ).thenReturn( project );
        when( projectService.modifyPermissions( eq( project.getName() ), isA( ProjectPermissions.class ) ) ).
            thenAnswer( i -> i.getArguments()[1] );

        mockProjectPermissions( project.getName() );

        String jsonString = request().path( "project/create" ).
            entity( readFromFile( "create_public_project_params.json" ), MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertJson( "create_public_project_success.json", jsonString );
    }

    @Test
    public void create_project_with_parents()
        throws Exception
    {
        final Project project = createProject( "project1", "project name 1", "project description 1", Attachment.create().
            name( "logo.png" ).
            mimeType( "image/png" ).
            label( "small" ).
            build(), "parent1" );

        mockRootContent();
        when( projectService.create( isA( CreateProjectParams.class ) ) ).thenReturn( project );
        when( projectService.modifyPermissions( eq( project.getName() ), isA( ProjectPermissions.class ) ) ).
            thenAnswer( i -> i.getArguments()[1] );

        mockProjectPermissions( project.getName() );

        String jsonString = request().path( "project/create" ).
            entity( readFromFile( "create_project_params.json" ), MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertJson( "create_project_with_parents.json", jsonString );
    }

    @Test
    public void modify_project_success()
        throws Exception
    {
        final Project project = createProject( "project1", "project name 1", "project description 1", Attachment.create().
            name( "logo.png" ).
            mimeType( "image/png" ).
            label( "small" ).
            build() );

        mockProjectPermissions( project.getName() );
        mockRootContent();

        when( projectService.modify( isA( ModifyProjectParams.class ) ) ).thenReturn( project );
        when( projectService.modifyPermissions( isA( ProjectName.class ), isA( ProjectPermissions.class ) ) ).
            thenAnswer( i -> i.getArguments()[1] );
        when( projectService.modifyPermissions( eq( project.getName() ), isA( ProjectPermissions.class ) ) ).
            thenAnswer( i -> i.getArguments()[1] );

        String jsonString = request().path( "project/modify" ).
            entity( readFromFile( "create_project_params.json" ), MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

        assertJson( "create_project_success.json", jsonString );
    }

    @Test
    public void modify_language_success()
        throws Exception
    {
        testModifyLanguage( "en" );
    }

    @Test
    public void modify_language_null()
        throws Exception
    {
        testModifyLanguage( null );
    }

    @Test
    public void modify_language_empty()
        throws Exception
    {
        testModifyLanguage( "" );
    }

    private void testModifyLanguage( final String language )
        throws Exception
    {
        createProject( "project1", "project name 1", "project description 1", Attachment.create().
            name( "logo.png" ).
            mimeType( "image/png" ).
            label( "small" ).
            build() );

        final Content rootContent = mockRootContent();

        when( contentService.update( isA( UpdateContentParams.class ) ) ).
            then( args -> {
                final UpdateContentParams params = args.getArgument( 0 );
                final ContentEditor contentEditor = params.getEditor();
                final EditableContent editableContent = new EditableContent( rootContent );

                contentEditor.edit( editableContent );
                final Content modifiedContent = editableContent.build();

                assertEquals( language, Optional.ofNullable( modifiedContent.getLanguage() ).
                    map( Locale::toLanguageTag ).
                    orElse( null ) );

                return modifiedContent;
            } );

        request().path( "project/modifyLanguage" ).
            entity( "{\"name\":\"project1\",\"language\":" + language + "}", MediaType.APPLICATION_JSON_TYPE ).
            post().getAsString();

    }

    @Test
    public void testModifyIcon()
        throws Exception
    {
        final Project project = createProject( "project1", "project name 1", "project description 1", Attachment.create().
            name( "logo.png" ).
            mimeType( "image/png" ).
            label( "small" ).
            build() );

        createIconForm( project.getName(), 150 );

        doAnswer( invocation -> {
            final Object[] args = invocation.getArguments();

            ModifyProjectIconParams params = (ModifyProjectIconParams) args[0];
            assertEquals( project.getName(), params.getName() );
            assertEquals( 726L, params.getIcon().getByteSource().size() );
            assertEquals( 150, params.getScaleWidth() );

            return null;
        } ).when( projectService ).modifyIcon( any() );

        request().path( "project/modifyIcon" )
            .entity( new byte[]{}, MediaType.MULTIPART_FORM_DATA_TYPE )
            .post()
            .getAsString();
    }

    @Test
    public void testModifyIcon_exceed_max_upload_size()
        throws Exception
    {
        final AdminRestConfig adminRestConfig = mock( AdminRestConfig.class );
        final ProjectConfig projectConfig = mock( ProjectConfig.class );
        when( adminRestConfig.uploadMaxFileSize() ).thenReturn( "1b" );
        when( projectConfig.multiInheritance() ).thenReturn( false );

        resource.activate( adminRestConfig, projectConfig );
        final Project project = createProject( "project1", "project name 1", "project description 1",
                                               Attachment.create().name( "logo.png" ).mimeType( "image/png" ).label( "small" ).build() );

        createIconForm( project.getName(), 150 );

        final MockRestResponse get = request().path( "project/modifyIcon" )
            .entity( new byte[]{}, MediaType.MULTIPART_FORM_DATA_TYPE )
            .post();

        assertEquals( 500, get.getStatus() );
        assertEquals( "File size exceeds maximum allowed upload size", get.getAsString() );
    }

    @Test
    public void modify_permissions_success()
        throws Exception
    {
        mockRootContent();

        final ProjectName projectName = ProjectName.from( "project1" );
        when( projectService.modifyPermissions( eq( projectName ), isA( ProjectPermissions.class ) ) )
            .then( args -> {
                final ProjectPermissions projectPermissions = args.getArgument( 1 );
                assertAll( () -> assertTrue( projectPermissions.getOwner().contains( PrincipalKey.from( "user:system:user1" ) ) ),
                           () -> assertTrue( projectPermissions.getEditor().contains( PrincipalKey.from( "user:system:user2" ) ) ),
                           () -> assertTrue( projectPermissions.getAuthor().contains( PrincipalKey.from( "user:system:user3" ) ) ),
                           () -> assertTrue( projectPermissions.getContributor().contains( PrincipalKey.from( "user:system:user4" ) ) ),
                           () -> assertTrue( projectPermissions.getViewer().contains( PrincipalKey.from( "user:system:user5" ) ) ) );

                return projectPermissions;
            } );

        request().path( "project/modifyPermissions" ).
            entity( readFromFile( "modify_permissions_params.json" ), MediaType.APPLICATION_JSON_TYPE ).
            post();
    }

    @Test
    public void modify_read_access_success()
        throws Exception
    {
        mockRootContent();

        request().path( "project/modifyReadAccess" ).
            entity( readFromFile( "modify_read_access_params.json" ), MediaType.APPLICATION_JSON_TYPE ).
            post();

        verify( taskService, times( 1 ) )
            .submitLocalTask( any( SubmitLocalTaskParams.class ) );
    }

    @Test
    public void delete_project()
        throws Exception
    {
        when( projectService.delete( ProjectName.from( "project1" ) ) ).thenReturn( true );

        final String jsonString = request().
            path( "project/delete" ).
            entity( "{\"name\" : \"project1\"}", MediaType.APPLICATION_JSON_TYPE ).
            post().
            getAsString();

        assertEquals( "true", jsonString );
    }

    @Test
    public void delete_default_project_not_fails()
        throws Exception
    {
        MockRestResponse mockRestResponse =
            request().path( "project/delete" ).entity( "{\"name\" : \"default\"}", MediaType.APPLICATION_JSON_TYPE ).post();

        assertEquals( HttpStatus.OK.value(), mockRestResponse.getStatus() );
    }

    @Test
    public void sync()
        throws Exception
    {
        when( taskService.submitLocalTask( any( SubmitLocalTaskParams.class ) ) ).thenReturn( TaskId.from( "task-id" ) );

        final MockRestResponse result = request().path( "project/syncAll" ).
            entity( "", MediaType.APPLICATION_JSON_TYPE ).
            post();

        assertEquals( "{\"taskId\":\"task-id\"}", result.getDataAsString() );
    }

    private Project createProject( final String name, final String displayName, final String description, final Attachment icon )
    {
        return Project.create().
            name( ProjectName.from( name ) ).
            displayName( displayName ).
            description( description ).
            icon( icon ).
            build();
    }

    private Project createProject( final String name, final String parent )
    {
        return createProject( name, name, null, null, parent );
    }

    private Project createProject( final String name, final String displayName, final String description, final Attachment icon,
                                   final String parent )
    {
        final Project.Builder builder =
            Project.create().name( ProjectName.from( name ) ).displayName( displayName ).description( description ).icon( icon );

        if ( parent != null )
        {
            builder.parent( ProjectName.from( parent ) );
        }

        return builder.build();
    }

    private MultipartForm createIconForm( final ProjectName projectName, final int scaleWidth )
        throws IOException
    {
        final MultipartForm form = mock( MultipartForm.class );

        try (InputStream stream = this.getClass().getResourceAsStream( "icon/projecticon1.png" ))
        {
            final MultipartItem file = createItem( "icon", "logo.png", 10, "png", "image/png", stream.readAllBytes() );

            when( form.iterator() ).thenReturn( Lists.newArrayList( file ).iterator() );
            when( form.get( "icon" ) ).thenReturn( file );
            if ( projectName != null )
            {
                when( form.getAsString( "name" ) ).thenReturn( projectName.toString() );
            }
            if ( scaleWidth > 0 )
            {

                when( form.getAsString( "scaleWidth" ) ).thenReturn( String.valueOf( scaleWidth ) );
            }

            when( form.getAsString( "readAccess" ) ).thenReturn( "{\"type\":\"custom\", \"principals\":[\"user:system:custom\"]}" );

            when( this.multipartService.parse( any() ) ).thenReturn( form );

            return form;
        }

    }

    private MultipartItem createItem( final String name, final String fileName, final long size, final String ext, final String type,
                                      final byte[] bytes )
    {
        final MultipartItem item = mock( MultipartItem.class );
        when( item.getName() ).thenReturn( name );
        when( item.getFileName() ).thenReturn( fileName + "." + ext );
        when( item.getContentType() ).thenReturn( com.google.common.net.MediaType.parse( type ) );
        when( item.getSize() ).thenReturn( size );
        when( item.getBytes() ).thenReturn( ByteSource.wrap( bytes ) );
        return item;
    }

    private void mockProjectPermissions( final ProjectName projectName )
    {
        final ProjectPermissions projectPermissions = ProjectPermissions.create().
            addOwner( PrincipalKey.from( "user:system:owner" ) ).
            addEditor( PrincipalKey.from( "user:system:editor" ) ).
            addAuthor( PrincipalKey.from( "user:system:author" ) ).
            addContributor( PrincipalKey.from( "user:system:contributor" ) ).
            addViewer( PrincipalKey.from( "user:system:custom" ) ).
            build();

        when( projectService.getPermissions( projectName ) ).thenReturn( projectPermissions );
    }

    private Content mockRootContent()
    {
        final Content contentRoot = Content.create().id( ContentId.from( "123" ) ).
            name( ContentName.from( "root" ) ).
            parentPath( ContentPath.ROOT ).
            permissions( AccessControlList.empty() ).
            language( Locale.ENGLISH ).
            data( new PropertyTree() ).
            extraDatas( ExtraDatas.empty() ).
            build();

        when( contentService.getByPath( ContentPath.ROOT ) ).thenReturn( contentRoot );
        when( contentService.update( isA( UpdateContentParams.class ) ) ).thenReturn( contentRoot );

        return contentRoot;
    }
}
