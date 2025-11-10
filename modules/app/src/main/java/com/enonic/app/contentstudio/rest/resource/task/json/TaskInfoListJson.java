package com.enonic.app.contentstudio.rest.resource.task.json;

import java.util.List;
import java.util.stream.Collectors;

import com.enonic.xp.task.TaskInfo;
import com.enonic.app.contentstudio.json.task.TaskInfoJson;

public class TaskInfoListJson
{
    private final List<TaskInfoJson> tasks;

    public TaskInfoListJson( final List<TaskInfo> taskInfoList )
    {
        tasks = taskInfoList.stream().map( TaskInfoJson::new ).collect( Collectors.toList() );
    }

    public List<TaskInfoJson> getTasks()
    {
        return tasks;
    }
}
