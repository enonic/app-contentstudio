package com.enonic.app.contentstudio.rest.resource.content.task;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import com.enonic.app.contentstudio.rest.resource.content.json.UnpublishContentJson;
import com.enonic.xp.content.CompareContentResult;
import com.enonic.xp.content.CompareContentResults;
import com.enonic.xp.content.CompareContentsParams;
import com.enonic.xp.content.CompareStatus;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentQuery;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.FindContentIdsByQueryResult;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.xp.content.UnpublishContentParams;
import com.enonic.xp.content.UnpublishContentsResult;
import com.enonic.xp.task.SubmitLocalTaskParams;
import com.enonic.xp.task.TaskId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;

class UnpublishRunnableTaskTest
    extends AbstractRunnableTaskTest
{
    private UnpublishContentJson params;

    @BeforeEach
    void setUp()
    {
        this.params = Mockito.mock( UnpublishContentJson.class );
    }

    @Override
    protected UnpublishRunnableTask createAndRunTask()
    {
        final UnpublishRunnableTask task = UnpublishRunnableTask.create().
            params( params ).
            description( "Unpublish content" ).
            taskService( taskService ).
            contentService( contentService ).
            build();

        task.run( TaskId.from( "taskId" ), progressReporter );

        return task;
    }

    @Test
    void create_message_multiple()
    {
        final UnpublishContentsResult result = UnpublishContentsResult.create().
            addUnpublished( contents.get( 0 ).getId() ).
            addUnpublished( contents.get( 1 ).getId() ).
            addUnpublished( contents.get( 2 ).getId() ).
            build();

        Set<String> ids = contents.stream().map( content -> content.getId().toString() ).collect( Collectors.toSet() );

        final ArgumentCaptor<Integer> progressArgumentCaptor = ArgumentCaptor.forClass( Integer.class );

        Mockito.when( params.getIds() ).thenReturn( ids );
        Mockito.when( contentService.getByIds( Mockito.isA( GetContentByIdsParams.class ) ) ).thenReturn( Contents.from( contents ) );
        Mockito.when( contentService.find( Mockito.isA( ContentQuery.class ) ) )
            .thenReturn( FindContentIdsByQueryResult.create().contents( ContentIds.from( ids ) ).build() );
        Mockito.when( contentService.unpublish( Mockito.isA( UnpublishContentParams.class ) ) ).thenReturn( result );
        Mockito.when( contentService.compare( Mockito.isA( CompareContentsParams.class ) ) ).
            thenReturn(
                CompareContentResults.create().add( new CompareContentResult( CompareStatus.EQUAL, ContentId.from( "id4" ) ) ).build() );

        final UnpublishRunnableTask task = createAndRunTask();
        task.createTaskResult();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );
        Mockito.verify( progressReporter, Mockito.times( 1 ) ).progress( Mockito.anyInt(), progressArgumentCaptor.capture() );
        Mockito.verify( taskService, Mockito.times( 1 ) )
            .submitLocalTask( any( SubmitLocalTaskParams.class ) );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals( 4, progressArgumentCaptor.getValue().intValue() );
        assertEquals( "{\"state\":\"SUCCESS\",\"message\":\"3 items have been unpublished\"}", resultMessage );
    }

    @Test
    void create_message_single()
    {
        final UnpublishContentsResult result = UnpublishContentsResult.create().
            addUnpublished( contents.get( 0 ).getId() ).
            build();

        Set<String> ids = Collections.singleton( contents.get( 0 ).getId().toString() );

        Mockito.when( params.getIds() ).thenReturn( ids );
        Mockito.when( contentService.getByIds( Mockito.isA( GetContentByIdsParams.class ) ) ).thenReturn( Contents.from( contents ) );
        Mockito.when( contentService.find( Mockito.isA( ContentQuery.class ) ) )
            .thenReturn( FindContentIdsByQueryResult.create().contents( ContentIds.from( ids ) ).build() );
        Mockito.when( contentService.unpublish( Mockito.isA( UnpublishContentParams.class ) ) ).thenReturn( result );
        Mockito.when( contentService.compare( Mockito.isA( CompareContentsParams.class ) ) ).
            thenReturn( CompareContentResults.create().build() );

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals( "{\"state\":\"SUCCESS\",\"message\":\"Item \\\"id1\\\" has been unpublished.\"}", resultMessage );
    }

    @Test
    void create_message_none()
    {
        final UnpublishContentsResult result = UnpublishContentsResult.create().build();

        Set<String> ids = Collections.emptySet();

        Mockito.when( params.getIds() ).thenReturn( ids );
        Mockito.when( contentService.getByIds( Mockito.isA( GetContentByIdsParams.class ) ) ).thenReturn( Contents.from( contents ) );
        Mockito.when( contentService.find( Mockito.isA( ContentQuery.class ) ) )
            .thenReturn( FindContentIdsByQueryResult.create().contents( ContentIds.from( ids ) ).build() );
        Mockito.when( contentService.unpublish( Mockito.isA( UnpublishContentParams.class ) ) ).thenReturn( result );
        Mockito.when( contentService.compare( Mockito.isA( CompareContentsParams.class ) ) ).
            thenReturn( CompareContentResults.create().build() );

        createAndRunTask();

        Mockito.verify( progressReporter, Mockito.times( 2 ) ).info( contentQueryArgumentCaptor.capture() );

        final String resultMessage = contentQueryArgumentCaptor.getAllValues().get( 1 );

        assertEquals( "{\"state\":\"WARNING\",\"message\":\"Nothing to unpublish.\"}", resultMessage );
    }
}
