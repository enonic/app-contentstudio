package com.enonic.app.contentstudio.rest.resource.content;

import com.enonic.app.contentstudio.rest.resource.content.task.TaskPhases;
import com.enonic.xp.content.PushContentListener;
import com.enonic.xp.task.ProgressReporter;

public final class PublishContentProgressListener
    implements PushContentListener
{

    private final ProgressReporter progressReporter;

    private int total = 0;

    private int progressCount = 0;

    private boolean started = false;

    public PublishContentProgressListener( final ProgressReporter progressReporter )
    {
        this.progressReporter = progressReporter;
    }

    @Override
    public void contentPushed( final int count )
    {
        if ( !started )
        {
            started = true;
            progressReporter.info( TaskPhases.phaseInfo( "publish", total ) );
        }

        progressCount = progressCount + count;
        progressReporter.progress( progressCount, total );
    }

    @Override
    public void contentResolved( final int count )
    {
        total = count;
    }
}
