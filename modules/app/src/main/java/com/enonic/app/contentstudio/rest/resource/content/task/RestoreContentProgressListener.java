package com.enonic.app.contentstudio.rest.resource.content.task;

import com.enonic.xp.archive.RestoreContentListener;
import com.enonic.xp.task.ProgressReporter;

public final class RestoreContentProgressListener
    implements RestoreContentListener
{
    private final ProgressReporter progressReporter;

    private int total = 0;

    private int progressCount = 0;

    private boolean started = false;

    public RestoreContentProgressListener( final ProgressReporter progressReporter )
    {
        this.progressReporter = progressReporter;
    }

    public void setTotal( final int count )
    {
        total = count;
    }

    @Override
    public void contentRestored( final int count )
    {
        if ( !started )
        {
            started = true;
            progressReporter.info( TaskPhases.phaseInfo( "restore", total ) );
        }

        progressCount = progressCount + count;
        progressReporter.progress( progressCount, total );
    }
}

