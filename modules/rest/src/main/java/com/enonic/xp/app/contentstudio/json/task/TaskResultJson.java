package com.enonic.xp.app.contentstudio.json.task;

import com.enonic.xp.task.TaskId;

public class TaskResultJson
{
    private final TaskId taskId;

    public TaskResultJson( final TaskId taskId )
    {
        this.taskId = taskId;
    }

    public String getTaskId()
    {
        return taskId.toString();
    }
}
