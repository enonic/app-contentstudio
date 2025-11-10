package com.enonic.app.contentstudio.rest.resource.content.task;

import java.util.Collections;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.enonic.app.contentstudio.rest.resource.content.json.DeleteContentJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentNotFoundException;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentPaths;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.DeleteContentParams;
import com.enonic.xp.content.DeleteContentsResult;
import com.enonic.xp.content.FindContentByParentParams;
import com.enonic.xp.content.FindContentIdsByParentResult;
import com.enonic.xp.task.SubmitLocalTaskParams;
import com.enonic.xp.task.TaskId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;

public class DeleteRunnableTaskTest
    extends AbstractRunnableTaskTest
{
    private DeleteContentJson params;

    @BeforeEach
    public void setUp()
        throws Exception
    {
        this.params = Mockito.mock( DeleteContentJson.class );

        Mockito.when( this.contentService.findIdsByParent( Mockito.isA( FindContentByParentParams.class ) ) )
            .thenReturn( FindContentIdsByParentResult.create().totalHits( 0 ).build() );
    }

    @Override
    protected DeleteRunnableTask createAndRunTask()
    {
        final DeleteRunnableTask task = DeleteRunnableTask.create().
            params( params ).
            description( "Delete content" ).
            taskService( taskService ).
            contentService( contentService ).
            build();

        task.run( TaskId.from( "taskId" ), progressReporter );

        return task;
    }

    @Test
    public void create_message_multiple()
        throws Exception
    {
        Mockito.when( params.getContentPaths() )
            .thenReturn( contents.stream().map( content -> content.getPath().toString() ).collect( Collectors.toSet() ) );
        Mockito.when( contentService.delete( Mockito.isA( DeleteContentParams.class ) ) ).
            thenReturn(
            DeleteContentsResult.create().addDeleted( contents.get( 0 ).getId() ).addDeleted( ContentId.from( "id4" ) ).build() ).
            thenReturn( DeleteContentsResult.create().build() ).
            thenThrow( ContentNotFoundException.create().contentPath( contents.get( 2 ).getPath() ).build() );
        Mockito.when( contentService.getByPath( Mockito.isA( ContentPath.class ) ) ).thenReturn( contents.get( 2 ) );
        Mockito.when( contentService.getByPaths( Mockito.isA( ContentPaths.class ) ) ).thenReturn( Contents.empty());

        final DeleteRunnableTask task = createAndRunTask();
        task.createTaskResult();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );
        Mockito.verify( taskService, Mockito.times( 1 ) ).submitLocalTask( any( SubmitLocalTaskParams.class ) );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals(
            "{\"state\":\"WARNING\",\"message\":\"2 items are deleted. Item \\\"content2\\\" could not be deleted.\"}",
            resultMessage );
    }

    @Test
    public void create_message_single()
        throws Exception
    {
        Mockito.when( params.getContentPaths() )
            .thenReturn( contents.subList( 2, 3 ).stream().map( content -> content.getPath().toString() ).collect( Collectors.toSet() ) );
        Mockito.when( contentService.delete( Mockito.isA( DeleteContentParams.class ) ) ).thenReturn(
            DeleteContentsResult.create().addDeleted( contents.get( 2 ).getId() ).build() );
        Mockito.when( contentService.getByPaths( Mockito.isA( ContentPaths.class ) ) ).thenReturn( Contents.empty());

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals( "{\"state\":\"SUCCESS\",\"message\":\"Item \\\"content3\\\" is deleted.\"}", resultMessage );
    }

    @Test
    public void create_message_single_online()
        throws Exception
    {
        final ContentPaths contentPaths = ContentPaths.from(
            contents.subList( 2, 3 ).stream().map( content -> content.getPath().toString() ).collect( Collectors.toSet() ) );

        Mockito.when( params.getContentPaths() )
            .thenReturn( contentPaths.stream().map( ContentPath::toString ).collect( Collectors.toSet() ) );
        Mockito.when( contentService.delete( Mockito.isA( DeleteContentParams.class ) ) ).thenReturn(
            DeleteContentsResult.create().addDeleted( contents.get( 2 ).getId() ).build() );
        Mockito.when( contentService.getByPaths( contentPaths ) ).thenReturn( Contents.from( contents.subList( 2, 3 ) ) );

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals( "{\"state\":\"SUCCESS\",\"message\":\"Item \\\"content3\\\" is deleted.\"}", resultMessage );
    }

    @Test
    public void create_message_single_failed()
        throws Exception
    {
        Mockito.when( params.getContentPaths() )
            .thenReturn( contents.subList( 2, 3 ).stream().map( content -> content.getPath().toString() ).collect( Collectors.toSet() ) );
        Mockito.when( contentService.delete( Mockito.isA( DeleteContentParams.class ) ) ).thenThrow(
            ContentNotFoundException.create().contentPath( contents.get( 2 ).getPath() ).build() );
        Mockito.when( contentService.getByPath( Mockito.isA( ContentPath.class ) ) ).thenReturn( contents.get( 2 ) );
        Mockito.when( contentService.getByPaths( Mockito.isA( ContentPaths.class ) ) ).thenReturn( Contents.empty());

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals( "{\"state\":\"ERROR\",\"message\":\"Item \\\"content3\\\" could not be deleted.\"}", resultMessage );
    }

    @Test
    public void create_message_none()
        throws Exception
    {
        Mockito.when( params.getContentPaths() ).thenReturn( Collections.emptySet() );
        Mockito.when( contentService.getByPaths( Mockito.isA( ContentPaths.class ) ) ).thenReturn( Contents.empty());

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals( "{\"state\":\"WARNING\",\"message\":\"Nothing to delete.\"}", resultMessage );
    }
}
