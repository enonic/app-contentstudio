package com.enonic.app.contentstudio.rest.resource.archive;

import com.enonic.xp.archive.ArchiveContentListener;
import com.enonic.xp.content.PushContentListener;
import com.enonic.xp.task.ProgressReporter;

public final class ArchiveContentProgressListener
    implements ArchiveContentListener, PushContentListener
{
    private final ProgressReporter progressReporter;

    private int total = 0;

    private int progressCount = 0;

    public ArchiveContentProgressListener( final ProgressReporter progressReporter )
    {
        this.progressReporter = progressReporter;
    }

    public void setTotal( final int count )
    {
        total = count;
        progressReporter.progress( progressCount, total );
    }

    @Override
    public void contentArchived( final int count )
    {
        advance( count );
    }

    @Override
    public void contentPushed( final int count )
    {
        advance( count );
    }

    @Override
    public void contentResolved( final int count )
    {
        // Total spans both the unpublish and archive phases and is set via setTotal
    }

    private void advance( final int count )
    {
        progressCount = progressCount + count;
        progressReporter.progress( progressCount, total );
    }
}
