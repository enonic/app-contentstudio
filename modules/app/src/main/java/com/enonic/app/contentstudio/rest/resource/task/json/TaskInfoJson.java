package com.enonic.app.contentstudio.rest.resource.task.json;

import java.time.Instant;
import java.util.Objects;

import com.enonic.xp.task.TaskInfo;

public class TaskInfoJson
{
    private final TaskInfo taskInfo;

    public TaskInfoJson( TaskInfo taskInfo )
    {
        this.taskInfo = Objects.requireNonNull( taskInfo );
    }

    public String getId()
    {
        return this.taskInfo.getId().toString();
    }

    public String getDescription()
    {
        return this.taskInfo.getDescription();
    }

    public String getName()
    {
        return this.taskInfo.getName();
    }

    public String getState()
    {
        return this.taskInfo.getState().name();
    }

    public String getApplication()
    {
        return this.taskInfo.getApplication().toString();
    }

    public String getUser()
    {
        return this.taskInfo.getUser().toString();
    }

    public Instant getStartTime()
    {
        return this.taskInfo.getStartTime();
    }

    public TaskProgressJson getProgress()
    {
        return this.taskInfo.getProgress() != null ? new TaskProgressJson( this.taskInfo.getProgress() ) : null;
    }
}
