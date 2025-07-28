package com.enonic.xp.app.contentstudio.rest.resource.content.task;

import com.enonic.xp.app.contentstudio.json.task.AbstractRunnableTask;
import com.enonic.xp.app.contentstudio.rest.resource.content.UnpublishContentProgressListener;
import com.enonic.xp.app.contentstudio.rest.resource.content.json.UnpublishContentJson;
import com.enonic.xp.app.contentstudio.rest.resource.content.query.ContentQueryWithChildren;
import com.enonic.xp.content.*;
import com.enonic.xp.task.ProgressReporter;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;

import java.util.EnumSet;
import java.util.Set;

public class UnpublishRunnableTask
    extends AbstractRunnableTask
{
    public static final Set<CompareStatus> IGNORE_STATUES = EnumSet.of( CompareStatus.EQUAL, CompareStatus.NEWER );

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
        final ContentIds contentIds = ContentIds.from( params.getIds() );
        progressReporter.info( "Unpublishing content" );

        final PushContentListener listener = new UnpublishContentProgressListener( progressReporter );

        final ContentIds childrenIds = ContentQueryWithChildren.create().
            contentService( this.contentService ).
            contentsPaths( contentService.getByIds( new GetContentByIdsParams( contentIds ) ).getPaths() ).
            size( -1 ).
            build().
            find().
            getContentIds();

        final ContentIds filteredChildrenIds = this.filterIdsByStatus( childrenIds );

        listener.contentResolved( filteredChildrenIds.getSize() + contentIds.getSize() );

        final UnpublishRunnableTaskResult.Builder resultBuilder = UnpublishRunnableTaskResult.create();

        try
        {
            final UnpublishContentsResult result = this.contentService.unpublishContent( UnpublishContentParams.create().
                contentIds( contentIds ).
                pushListener( listener ).
                build() );

            final ContentIds unpublishedContents = result.getUnpublishedContents();

            if ( unpublishedContents.getSize() == 1 )
            {
                resultBuilder.succeeded( result.getContentPath() );
            }
            else
            {
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
