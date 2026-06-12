package com.enonic.app.contentstudio.rest.resource.content;

import com.enonic.app.contentstudio.rest.resource.content.task.TaskPhases;
import com.enonic.xp.content.DeleteContentListener;
import com.enonic.xp.task.ProgressReporter;

public final class DeleteContentProgressListener
    implements DeleteContentListener
{
    private final ProgressReporter progressReporter;

    private int total = 0;

    private int progressCount = 0;

    private boolean started = false;

    public DeleteContentProgressListener( final ProgressReporter progressReporter )
    {
        this.progressReporter = progressReporter;
    }

    public void setTotal( final int count )
    {
        total = count;
    }

    @Override
    public void contentDeleted( final int count )
    {
        if ( !started )
        {
            started = true;
            progressReporter.info( TaskPhases.phaseInfo( "delete", total ) );
        }

        progressCount = progressCount + count;
        progressReporter.progress( progressCount, total );
    }
}
