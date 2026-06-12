package com.enonic.app.contentstudio.rest.resource.content.task;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.enonic.app.contentstudio.rest.resource.archive.ArchiveContentProgressListener;
import com.enonic.app.contentstudio.rest.resource.archive.json.ArchiveContentJson;
import com.enonic.app.contentstudio.rest.resource.content.query.ContentQueryWithChildren;
import com.enonic.xp.archive.ArchiveContentException;
import com.enonic.xp.archive.ArchiveContentParams;
import com.enonic.xp.archive.ArchiveContentsResult;
import com.enonic.xp.content.CompareContentResult;
import com.enonic.xp.content.CompareContentResults;
import com.enonic.xp.content.CompareContentsParams;
import com.enonic.xp.content.CompareStatus;
import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.Contents;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.xp.content.UnpublishContentParams;
import com.enonic.app.contentstudio.json.task.AbstractRunnableTask;
import com.enonic.xp.task.ProgressReporter;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;

public class ArchiveRunnableTask
    extends AbstractRunnableTask
{
    private static final Set<CompareStatus> ONLINE_STATUSES =
        EnumSet.of( CompareStatus.EQUAL, CompareStatus.NEWER, CompareStatus.OLDER, CompareStatus.MOVED );

    private static final int UNPUBLISH_BATCH_SIZE = 50;

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
        final ContentIds contentToArchiveIds = params.getContentIds().stream().map( ContentId::from ).collect( ContentIds.collector() );

        final Contents contentsToArchive =
            contentService.getByIds( GetContentByIdsParams.create().contentIds( contentToArchiveIds ).build() );

        final ContentIds childrenIds = ContentQueryWithChildren.create()
            .contentService( this.contentService )
            .contentsPaths( contentsToArchive.getPaths() )
            .size( -1 )
            .build()
            .find()
            .getContentIds();

        final ContentIds allIds = ContentIds.create().addAll( contentToArchiveIds ).addAll( childrenIds ).build();

        final ContentIds publishedIds = filterPublished( allIds );

        final List<ContentId> orderedChildrenIds = new ArrayList<>( childrenIds.getSet() );
        Collections.reverse( orderedChildrenIds );

        final List<ContentId> idsToUnpublish = Stream.concat( orderedChildrenIds.stream(), contentsToArchive.stream()
                .sorted( ( a, b ) -> b.getPath().elementCount() - a.getPath().elementCount() )
                .map( Content::getId ) )
            .filter( publishedIds::contains )
            .collect( Collectors.toList() );

        final ArchiveContentProgressListener listener = new ArchiveContentProgressListener( progressReporter );
        listener.setTotal( idsToUnpublish.size() + allIds.getSize() );

        if ( !idsToUnpublish.isEmpty() )
        {
            progressReporter.info( TaskPhases.phaseInfo( "unpublish", idsToUnpublish.size() ) );

            for ( int from = 0; from < idsToUnpublish.size(); from += UNPUBLISH_BATCH_SIZE )
            {
                final List<ContentId> batch =
                    idsToUnpublish.subList( from, Math.min( from + UNPUBLISH_BATCH_SIZE, idsToUnpublish.size() ) );

                contentService.unpublish(
                    UnpublishContentParams.create().contentIds( ContentIds.from( batch ) ).pushListener( listener ).build() );
            }
        }

        progressReporter.info( TaskPhases.phaseInfo( "archive", allIds.getSize() ) );

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

    private ContentIds filterPublished( final ContentIds ids )
    {
        final CompareContentResults compareResults = contentService.compare( CompareContentsParams.create().contentIds( ids ).build() );

        return compareResults.stream()
            .filter( entry -> ONLINE_STATUSES.contains( entry.getCompareStatus() ) )
            .map( CompareContentResult::getContentId )
            .collect( ContentIds.collector() );
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
