package com.enonic.xp.app.contentstudio.rest.resource.content.task;

import java.util.stream.Collectors;

import com.enonic.xp.app.contentstudio.rest.resource.archive.ArchiveContentProgressListener;
import com.enonic.xp.app.contentstudio.rest.resource.archive.json.ArchiveContentJson;
import com.enonic.xp.archive.ArchiveContentException;
import com.enonic.xp.archive.ArchiveContentParams;
import com.enonic.xp.archive.ArchiveContentsResult;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.xp.app.contentstudio.json.task.AbstractRunnableTask;
import com.enonic.xp.task.ProgressReporter;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;

public class ArchiveRunnableTask
    extends AbstractRunnableTask
{
    private final ArchiveContentJson params;

    private ArchiveRunnableTask( Builder builder )
    {
        super( builder );
        this.params = builder.params;
    }

    public static Builder create()
    {
        return new Builder();
    }

    @Override
    public void run( final TaskId id, final ProgressReporter progressReporter )
    {
        final ContentIds contentToArchiveIds = ContentIds.from( params.getContentIds() );
        progressReporter.info( "Archiving content" );

        final ArchiveContentProgressListener listener = new ArchiveContentProgressListener( progressReporter );
        listener.setTotal( contentToArchiveIds.getSize() );

        final Contents contentsToArchive =
            contentService.getByIds( GetContentByIdsParams.create().contentIds( contentToArchiveIds ).build() );

        ArchiveRunnableTaskResult.Builder result = ArchiveRunnableTaskResult.create();

        for ( Content content : contentsToArchive.stream()
            .sorted( ( a, b ) -> b.getPath().elementCount() - a.getPath().elementCount() )
            .collect( Collectors.toList() ) )
        {
            final ArchiveContentParams archiveContentParams = ArchiveContentParams.create()
                .contentId( content.getId() )
                .message( params.getMessage() )
                .archiveContentListener( listener )
                .build();
            try
            {
                final ArchiveContentsResult archiveResult = contentService.archive( archiveContentParams );
                result.succeeded( archiveResult.getArchivedContents() );
            }
            catch ( ArchiveContentException e )
            {
                result.failed( e.getPath() );
            }
        }

        progressReporter.info( result.build().toJson() );
    }

    public static class Builder
        extends AbstractRunnableTask.Builder<Builder>
    {
        private ArchiveContentJson params;

        public Builder params( ArchiveContentJson params )
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
        public ArchiveRunnableTask build()
        {
            return new ArchiveRunnableTask( this );
        }
    }
}
