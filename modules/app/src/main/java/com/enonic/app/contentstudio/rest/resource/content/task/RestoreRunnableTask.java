package com.enonic.app.contentstudio.rest.resource.content.task;

import java.util.Comparator;
import java.util.stream.Collectors;

import com.google.common.base.Strings;

import com.enonic.app.contentstudio.rest.resource.archive.json.RestoreContentJson;
import com.enonic.xp.archive.RestoreContentException;
import com.enonic.xp.archive.RestoreContentParams;
import com.enonic.xp.archive.RestoreContentsResult;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.app.contentstudio.json.task.AbstractRunnableTask;
import com.enonic.xp.task.ProgressReporter;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;

public class RestoreRunnableTask
    extends AbstractRunnableTask
{
    private final RestoreContentJson params;

    private RestoreRunnableTask( Builder builder )
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
        final ContentIds contentToRestoreIds = ContentIds.from( params.getContentIds() );
        progressReporter.info( "Restoring content" );

        final RestoreContentProgressListener listener = new RestoreContentProgressListener( progressReporter );
        listener.setTotal( contentToRestoreIds.getSize() );

        final Contents contentsToRestore =
            contentService.getByIds( GetContentByIdsParams.create().contentIds( contentToRestoreIds ).build() );

        RestoreRunnableTaskResult.Builder result = RestoreRunnableTaskResult.create();

        final ContentPath path = Strings.nullToEmpty( params.getPath() ).isBlank() ? null : ContentPath.from( params.getPath() );

        for ( Content content : contentsToRestore.stream()
            .sorted( Comparator.comparingInt(
                a -> a.getOriginalParentPath() != null ? a.getOriginalParentPath().elementCount() : a.getPath().elementCount() ) )
            .collect( Collectors.toList() ) )
        {
            final RestoreContentParams restoreContentParams =
                RestoreContentParams.create().contentId( content.getId() ).path( path ).restoreContentListener( listener ).build();
            try
            {
                final RestoreContentsResult restoreResult = contentService.restore( restoreContentParams );
                result.succeeded( restoreResult.getRestoredContents() );
            }
            catch ( RestoreContentException e )
            {
                result.failed( e.getPath() );
            }
        }

        progressReporter.info( result.build().toJson() );
    }

    public static class Builder
        extends AbstractRunnableTask.Builder<Builder>
    {
        private RestoreContentJson params;

        public Builder params( RestoreContentJson params )
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
        public RestoreRunnableTask build()
        {
            return new RestoreRunnableTask( this );
        }
    }
}
