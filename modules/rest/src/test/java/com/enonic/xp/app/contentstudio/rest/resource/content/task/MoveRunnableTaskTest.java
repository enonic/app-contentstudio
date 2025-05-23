package com.enonic.xp.app.contentstudio.rest.resource.content.task;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.enonic.xp.app.contentstudio.rest.resource.content.json.MoveContentJson;
import com.enonic.xp.branch.Branch;
import com.enonic.xp.content.ContentAccessException;
import com.enonic.xp.content.ContentAlreadyExistsException;
import com.enonic.xp.content.ContentAlreadyMovedException;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentQuery;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.FindContentIdsByQueryResult;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.xp.content.MoveContentParams;
import com.enonic.xp.content.MoveContentsResult;
import com.enonic.xp.repository.RepositoryId;
import com.enonic.xp.security.User;
import com.enonic.xp.security.acl.Permission;
import com.enonic.xp.task.RunnableTask;
import com.enonic.xp.task.SubmitLocalTaskParams;
import com.enonic.xp.task.TaskId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;

public class MoveRunnableTaskTest
    extends AbstractRunnableTaskTest
{
    private MoveContentJson params;

    @BeforeEach
    public void setUp()
        throws Exception
    {
        this.params = Mockito.mock( MoveContentJson.class );
    }

    @Override
    protected MoveRunnableTask createAndRunTask()
    {
        final MoveRunnableTask task = MoveRunnableTask.create()
            .params( params )
            .description( "Move content" )
            .taskService( taskService )
            .contentService( contentService )
            .build();

        task.run( TaskId.from( "taskId" ), progressReporter );

        return task;
    }

    @Test
    public void create_message_2_success_1_error()
        throws Exception
    {
        Mockito.when( params.getContentIds() )
            .thenReturn( contents.stream().map( content -> content.getId().toString() ).collect( Collectors.toList() ) );
        Mockito.when( contentService.getByIds( Mockito.isA( GetContentByIdsParams.class ) ) ).thenReturn( Contents.from( contents ) );
        Mockito.when( contentService.find( Mockito.isA( ContentQuery.class ) ) )
            .thenReturn( FindContentIdsByQueryResult.create().totalHits( 3 ).build() );
        Mockito.when( contentService.move( Mockito.isA( MoveContentParams.class ) ) )
            .thenThrow( new ContentAlreadyMovedException( "Content already moved", contents.get( 0 ).getPath() ) )
            .thenThrow( ContentNotFoundException.create().contentPath( contents.get( 1 ).getPath() ).build() )
            .thenReturn( MoveContentsResult.create()
                             .addMoved( contents.get( 2 ).getId() )
                             .setContentName( contents.get( 2 ).getDisplayName() )
                             .build() );

        final MoveRunnableTask task = createAndRunTask();
        task.createTaskResult();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );
        Mockito.verify( taskService, Mockito.times( 1 ) ).submitLocalTask( any( SubmitLocalTaskParams.class ) );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals( "{\"state\":\"WARNING\",\"message\":\"2 items were moved ( Already moved: \\\"content1\\\" ). " +
                          "Item \\\"id2\\\" was not found.\"}", resultMessage );
    }

    @Test
    public void create_message_1_success()
        throws Exception
    {
        Mockito.when( params.getContentIds() ).thenReturn( Collections.singletonList( contents.get( 0 ).getId().toString() ) );
        Mockito.when( contentService.getByIds( Mockito.isA( GetContentByIdsParams.class ) ) )
            .thenReturn( Contents.from( contents.get( 0 ) ) );
        Mockito.when( contentService.find( Mockito.isA( ContentQuery.class ) ) )
            .thenReturn( FindContentIdsByQueryResult.create().totalHits( 1 ).build() );
        Mockito.when( contentService.move( Mockito.isA( MoveContentParams.class ) ) )
            .thenReturn( MoveContentsResult.create()
                             .addMoved( contents.get( 0 ).getId() )
                             .setContentName( contents.get( 1 ).getDisplayName() )
                             .build() );

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals( "{\"state\":\"SUCCESS\",\"message\":\"Item \\\"Content 2\\\" is moved.\"}", resultMessage );
    }

    @Test
    public void create_message_0_results()
        throws Exception
    {
        Mockito.when( params.getContentIds() ).thenReturn( Collections.emptyList() );
        Mockito.when( contentService.getByIds( Mockito.isA( GetContentByIdsParams.class ) ) ).thenReturn( Contents.empty() );
        Mockito.when( contentService.find( Mockito.isA( ContentQuery.class ) ) )
            .thenReturn( FindContentIdsByQueryResult.create().totalHits( 0 ).build() );

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals( "{\"state\":\"WARNING\",\"message\":\"Nothing was moved.\"}", resultMessage );
    }

    @Test
    public void create_message_1_success_2_errors()
        throws Exception
    {
        Mockito.when( params.getContentIds() )
            .thenReturn( contents.stream().map( content -> content.getId().toString() ).collect( Collectors.toList() ) );
        Mockito.when( contentService.getByIds( Mockito.isA( GetContentByIdsParams.class ) ) ).thenReturn( Contents.from( contents ) );
        Mockito.when( contentService.find( Mockito.isA( ContentQuery.class ) ) )
            .thenReturn( FindContentIdsByQueryResult.create().totalHits( 1 ).build() );
        Mockito.when( contentService.move( Mockito.isA( MoveContentParams.class ) ) )
            .thenThrow( new ContentAccessException( User.ANONYMOUS, contents.get( 0 ).getPath(), Permission.MODIFY ) )
            .thenReturn( MoveContentsResult.create()
                             .addMoved( contents.get( 0 ).getId() )
                             .setContentName( contents.get( 1 ).getDisplayName() )
                             .build() )
            .thenThrow( new ContentAlreadyExistsException( contents.get( 2 ).getPath(), RepositoryId.from( "some.repo" ),
                                                           Branch.from( "draft" ) ) );

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals(
            "{\"state\":\"WARNING\",\"message\":\"Item \\\"Content 2\\\" is moved. Failed to move 2 items ( Exist at destination: \\\"content3\\\", Access denied: \\\"content1\\\" ).\"}",
            resultMessage );
    }

    @Test
    public void create_message_1_success_1_error()
        throws Exception
    {
        Mockito.when( params.getContentIds() )
            .thenReturn( contents.subList( 0, 2 ).stream().map( content -> content.getId().toString() ).collect( Collectors.toList() ) );
        Mockito.when( params.getParentContentPath() ).thenReturn( ContentPath.from( "/forbidden/path" ) );
        Mockito.when( contentService.getByIds( Mockito.isA( GetContentByIdsParams.class ) ) )
            .thenReturn( Contents.from( contents.subList( 0, 2 ) ) );
        Mockito.when( contentService.find( Mockito.isA( ContentQuery.class ) ) )
            .thenReturn( FindContentIdsByQueryResult.create().totalHits( 2 ).build() );
        Mockito.when( contentService.move( Mockito.isA( MoveContentParams.class ) ) )
            .thenThrow( new ContentAlreadyMovedException( contents.get( 0 ).getDisplayName(), contents.get( 0 ).getPath() ) )
            .thenThrow( new ContentAccessException( User.ANONYMOUS, contents.get( 1 ).getPath(), Permission.MODIFY ) );

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals(
            "{\"state\":\"WARNING\",\"message\":\"Item \\\"content1\\\" is already moved. You don't have permissions to move to \\\"path\\\".\"}",
            resultMessage );
    }

    @Test
    public void create_message_3_success_6_errors()
        throws Exception
    {
        List<String> ids = contents.stream().map( content -> content.getId().toString() ).collect( Collectors.toList() );
        ids.addAll( List.of( "id4", "id5", "id6", "id7", "id8", "id9" ) );
        Mockito.when( params.getContentIds() ).thenReturn( ids );

        Mockito.when( contentService.getByIds( Mockito.isA( GetContentByIdsParams.class ) ) )
            .thenReturn( Contents.from( Contents.from( contents ) ) );

        Mockito.when( contentService.find( Mockito.isA( ContentQuery.class ) ) )
            .thenReturn( FindContentIdsByQueryResult.create().totalHits( 9 ).build() );

        Mockito.when( contentService.move( Mockito.isA( MoveContentParams.class ) ) )
            .thenThrow( new ContentAlreadyMovedException( "Content already moved", contents.get( 0 ).getPath() ) )
            .thenThrow( ContentNotFoundException.create().contentPath( contents.get( 1 ).getPath() ).build() )
            .thenThrow( new ContentAccessException( User.ANONYMOUS, contents.get( 2 ).getPath(), Permission.MODIFY ) )
            .thenThrow( new ContentAlreadyMovedException( "Content already moved", ContentPath.from( "/id4" ) ) )
            .thenThrow(
                new ContentAlreadyExistsException( ContentPath.from( "/id5" ), RepositoryId.from( "some.repo" ), Branch.from( "draft" ) ) )
            .thenThrow(
                new ContentAlreadyExistsException( ContentPath.from( "/id6" ), RepositoryId.from( "some.repo" ), Branch.from( "draft" ) ) )
            .thenReturn( MoveContentsResult.create().addMoved( ContentId.from( "id7" ) ).setContentName( "content 7" ).build() )
            .thenThrow( new ContentAccessException( User.ANONYMOUS, ContentPath.from( "/id8" ), Permission.READ ) )
            .thenThrow( ContentNotFoundException.create().contentPath( ContentPath.from( "/id9" ) ).build() );

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals(
            "{\"state\":\"WARNING\",\"message\":\"3 items were moved ( Already moved: 2 ). Failed to move 6 items ( Exist at destination: 2, Not found: 2, Access denied: 2 ).\"}",
            resultMessage );
    }
}
