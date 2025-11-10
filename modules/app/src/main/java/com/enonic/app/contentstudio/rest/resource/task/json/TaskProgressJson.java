package com.enonic.app.contentstudio.rest.resource.task.json;

import java.util.Objects;

import com.enonic.xp.task.TaskProgress;

public class TaskProgressJson
{
    private final TaskProgress taskProgress;

    public TaskProgressJson( TaskProgress taskProgress )
    {
        this.taskProgress = Objects.requireNonNull( taskProgress );
    }

    public int getCurrent()
    {
        return this.taskProgress.getCurrent();
    }

    public int getTotal()
    {
        return this.taskProgress.getTotal();
    }

    public String getInfo()
    {
        return this.taskProgress.getInfo();
    }
}
