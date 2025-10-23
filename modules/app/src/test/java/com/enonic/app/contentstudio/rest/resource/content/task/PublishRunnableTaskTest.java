package com.enonic.app.contentstudio.rest.resource.content.task;

import java.util.Collections;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.enonic.app.contentstudio.rest.resource.content.json.PublishContentJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.PublishContentResult;
import com.enonic.xp.content.PushContentParams;
import com.enonic.xp.task.SubmitLocalTaskParams;
import com.enonic.xp.task.TaskId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;

public class PublishRunnableTaskTest
    extends AbstractRunnableTaskTest
{
    private PublishContentJson params;

    @BeforeEach
    public void setUp()
        throws Exception
    {
        this.params = Mockito.mock( PublishContentJson.class );
    }

    @Override
    protected PublishRunnableTask createAndRunTask()
    {
        final PublishRunnableTask task = PublishRunnableTask.create().
            params( params ).
            description( "Publish content" ).
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
        final PublishContentResult result = PublishContentResult.create().
            add( PublishContentResult.Result.success( contents.get( 0 ).getId() ) ).
            add( PublishContentResult.Result.failure( contents.get( 2 ).getId(), PublishContentResult.Reason.INVALID ) ).
            build();

        Mockito.when( params.getIds() )
            .thenReturn( contents.stream().map( content -> content.getId().toString() ).collect( Collectors.toSet() ) );
        Mockito.when( params.getExcludedIds() ).thenReturn( Collections.emptySet() );
        Mockito.when( params.getExcludeChildrenIds() ).thenReturn( Collections.emptySet() );

        Mockito.when( contentService.publish( Mockito.isA( PushContentParams.class ) ) ).thenReturn( result );

        Mockito.when( contentService.getById( Mockito.eq( contents.get( 0 ).getId() ) ) ).thenReturn( contents.get( 0 ) );
        Mockito.when( contentService.getById( Mockito.eq( contents.get( 1 ).getId() ) ) ).thenReturn( contents.get( 1 ) );
        Mockito.when( contentService.getById( Mockito.eq( contents.get( 2 ).getId() ) ) ).thenReturn( contents.get( 2 ) );

        final PublishRunnableTask task = createAndRunTask();
        task.createTaskResult();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );
        Mockito.verify( taskService, Mockito.times( 1 ) ).submitLocalTask( any( SubmitLocalTaskParams.class ) );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals(
    "{\"state\":\"WARNING\",\"message\":\"Item \\\"content1\\\" has been published. Item \\\"content3\\\" could not be published.\"}",
            resultMessage
        );
    }

    private String runTask( final PublishContentResult result )
    {
        Mockito.when( params.getIds() ).thenReturn( Collections.singleton( contents.get( 0 ).getId().toString() ) );

        Mockito.when( contentService.publish( Mockito.isA( PushContentParams.class ) ) ).thenReturn( result );
        Mockito.when( contentService.getById( Mockito.isA( ContentId.class ) ) ).thenReturn( contents.get( 0 ) );

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        return contentQueryArgumentCaptor.getAllValues().get( 1 );
    }

    @Test
    public void create_message_single_published()
        throws Exception
    {
        final PublishContentResult result = PublishContentResult.create().
            add( PublishContentResult.Result.success( contents.get( 0 ).getId() ) ).
            build();

        assertEquals( "{\"state\":\"SUCCESS\",\"message\":\"Item \\\"content1\\\" has been published.\"}", runTask( result ) );
    }

    @Test
    public void create_message_single_failed()
        throws Exception
    {
        final PublishContentResult result = PublishContentResult.create().
            add( PublishContentResult.Result.failure( contents.get( 2 ).getId(), PublishContentResult.Reason.INVALID ) ).
            add( PublishContentResult.Result.failure( contents.get( 1 ).getId(), PublishContentResult.Reason.INVALID ) ).
            build();

        assertEquals( "{\"state\":\"ERROR\",\"message\":\"Failed to publish 2 items. \"}", runTask( result ) );
    }

    @Test
    public void create_message_none()
        throws Exception
    {
        final PublishContentResult result = PublishContentResult.create().build();

        assertEquals( "{\"state\":\"WARNING\",\"message\":\"Nothing to publish.\"}", runTask( result ) );
    }
}
