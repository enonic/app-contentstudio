package com.enonic.app.contentstudio.rest.resource.content.task;

public final class TaskPhases
{
    private TaskPhases()
    {
    }

    public static String phaseInfo( final String phase, final int count )
    {
        return String.format( "{\"phase\":\"%s\",\"count\":%d}", phase, count );
    }
}
