package com.enonic.app.contentstudio.json.task;

import com.enonic.xp.content.ContentService;
import com.enonic.xp.task.RunnableTask;
import com.enonic.xp.task.SubmitLocalTaskParams;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;

public abstract class AbstractRunnableTask
    implements RunnableTask
{
    protected final String description;

    protected final TaskService taskService;

    protected ContentService contentService;

    protected AbstractRunnableTask( Builder builder )
    {
        this.description = builder.description;
        this.taskService = builder.taskService;
        this.contentService = builder.contentService;
    }

    public TaskResultJson createTaskResult()
    {
        final SubmitLocalTaskParams params = SubmitLocalTaskParams.create().runnableTask( this ).description( description ).build();
        final TaskId taskId = taskService.submitLocalTask( params );
        return new TaskResultJson( taskId );
    }

    public abstract static class Builder<T extends Builder>
    {

        private String description;

        private TaskService taskService;

        private ContentService contentService;

        public T description( final String description )
        {
            this.description = description;
            return (T) this;
        }

        public T taskService( final TaskService taskService )
        {
            this.taskService = taskService;
            return (T) this;
        }

        public T contentService( final ContentService contentService )
        {
            this.contentService = contentService;
            return (T) this;
        }

        public abstract AbstractRunnableTask build();
    }
}
