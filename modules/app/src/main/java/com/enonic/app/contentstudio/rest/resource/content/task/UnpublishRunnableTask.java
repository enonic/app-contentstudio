package com.enonic.app.contentstudio.rest.resource.content.task;

import com.enonic.app.contentstudio.json.task.AbstractRunnableTask;
import com.enonic.app.contentstudio.rest.resource.content.UnpublishContentProgressListener;
import com.enonic.app.contentstudio.rest.resource.content.json.UnpublishContentJson;
import com.enonic.app.contentstudio.rest.resource.content.query.ContentQueryWithChildren;
import com.enonic.xp.content.*;
import com.enonic.xp.task.ProgressReporter;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class UnpublishRunnableTask
    extends AbstractRunnableTask
{
    public static final Set<CompareStatus> IGNORE_STATUES = EnumSet.of( CompareStatus.EQUAL, CompareStatus.NEWER );

    private static final int UNPUBLISH_BATCH_SIZE = 50;

    private final UnpublishContentJson params;

    private UnpublishRunnableTask( Builder builder )
    {
        super( builder );
        this.params = builder.params;
    }

    private ContentIds filterIdsByStatus( final ContentIds ids )
    {
        final CompareContentResults compareResults = contentService.compare( CompareContentsParams.create().contentIds( ids ).build() );

        return compareResults.
            stream().
            filter( entry -> IGNORE_STATUES.contains( entry.getCompareStatus() ) ).
            map( CompareContentResult::getContentId ).
            collect( ContentIds.collector() );
    }

    @Override
    public void run( final TaskId id, final ProgressReporter progressReporter )
    {
        final ContentIds contentIds = params.getIds().stream().map( ContentId::from ).collect( ContentIds.collector() );
        progressReporter.info( "Unpublishing content" );

        final PushContentListener listener = new UnpublishContentProgressListener( progressReporter );

        final Contents contents = contentService.getByIds( GetContentByIdsParams.create().contentIds( contentIds ).build() );

        final ContentIds childrenIds = ContentQueryWithChildren.create()
            .contentService( this.contentService )
            .contentsPaths( contents.getPaths() )
            .size( -1 )
            .build()
            .find()
            .getContentIds();

        final ContentIds filteredChildrenIds = this.filterIdsByStatus( childrenIds );

        final List<ContentId> orderedChildrenIds = new ArrayList<>( childrenIds.getSet() );
        Collections.reverse( orderedChildrenIds );

        final List<ContentId> idsToUnpublish = Stream.concat(
                orderedChildrenIds.stream().filter( filteredChildrenIds::contains ),
                contents.stream()
                    .sorted( ( a, b ) -> b.getPath().elementCount() - a.getPath().elementCount() )
                    .map( Content::getId ) )
            .collect( Collectors.toList() );

        if ( !idsToUnpublish.isEmpty() )
        {
            progressReporter.info( TaskPhases.phaseInfo( "unpublish", idsToUnpublish.size() ) );

            listener.contentResolved( idsToUnpublish.size() );
        }

        final UnpublishRunnableTaskResult.Builder resultBuilder = UnpublishRunnableTaskResult.create();

        try
        {
            for ( int from = 0; from < idsToUnpublish.size(); from += UNPUBLISH_BATCH_SIZE )
            {
                final List<ContentId> batch =
                    idsToUnpublish.subList( from, Math.min( from + UNPUBLISH_BATCH_SIZE, idsToUnpublish.size() ) );

                final UnpublishContentsResult result = this.contentService.unpublish(
                    UnpublishContentParams.create().contentIds( ContentIds.from( batch ) ).pushListener( listener ).build() );

                resultBuilder.succeeded( result.getUnpublishedContents() );
            }
        }
        catch ( Exception e )
        {
            if ( contentIds.getSize() == 1 )
            {
                resultBuilder.failed( contentService.getById( contentIds.first() ).getPath() );
            }
            else
            {
                resultBuilder.failed( contentIds );
            }
        }

        progressReporter.info( resultBuilder.build().toJson() );
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static class Builder
        extends AbstractRunnableTask.Builder
    {
        private UnpublishContentJson params;

        public Builder params( UnpublishContentJson params )
        {
            this.params = params;
            return this;
        }

        @Override
        public Builder description( String description )
        {
            super.description( description );
            return this;
        }

        @Override
        public Builder taskService( TaskService taskService )
        {
            super.taskService( taskService );
            return this;
        }

        @Override
        public Builder contentService( ContentService contentService )
        {
            super.contentService( contentService );
            return this;
        }

        @Override
        public UnpublishRunnableTask build()
        {
            return new UnpublishRunnableTask( this );
        }
    }
}
