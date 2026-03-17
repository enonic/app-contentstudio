package com.enonic.app.contentstudio.rest.resource.content.task;

import com.enonic.app.contentstudio.rest.resource.content.PublishContentProgressListener;
import com.enonic.app.contentstudio.rest.resource.content.json.PublishContentJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.PublishContentResult;
import com.enonic.xp.content.PushContentParams;
import com.enonic.app.contentstudio.json.task.AbstractRunnableTask;
import com.enonic.xp.task.ProgressReporter;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;

public class PublishRunnableTask
    extends AbstractRunnableTask
{
    private final PublishContentJson params;

    private PublishRunnableTask( Builder builder )
    {
        super( builder );
        this.params = builder.params;
    }


    public PublishContentJson getParams()
    {
        return params;
    }

    @Override
    public void run( final TaskId id, final ProgressReporter progressReporter )
    {
        final ContentIds contentIds = params.getIds().stream().map( ContentId::from ).collect( ContentIds.collector() );
        final ContentIds excludeContentIds = params.getExcludedIds().stream().map( ContentId::from ).collect( ContentIds.collector() );
        final ContentIds excludeDescendantsOf = params.getExcludeChildrenIds().stream().map( ContentId::from ).collect( ContentIds.collector() );
        final String message = params.getMessage();
        progressReporter.info( "Publishing content" );

        PublishRunnableTaskResult.Builder resultBuilder = PublishRunnableTaskResult.create();

        try
        {
            final PushContentParams.Builder builder = PushContentParams.create()
                .contentIds( contentIds )
                .excludedContentIds( excludeContentIds )
                .excludeDescendantsOf( excludeDescendantsOf )
                .includeDependencies( true )
                .pushListener( new PublishContentProgressListener( progressReporter ) )
                .message( message );

            if (params.getSchedule() != null)
            {
                builder.publishFrom( params.getSchedule().getPublishFrom() ).publishTo( params.getSchedule().getPublishTo() );
            }

            final PublishContentResult result = contentService.publish( builder.build() );

            ContentIds pushed = result.getPushedContents();
            ContentIds failed = result.getFailedContents();
            if ( pushed.getSize() == 1 )
            {
                resultBuilder.succeeded( contentService.getById( pushed.first() ).getPath() );
            }
            else
            {
                resultBuilder.succeeded( pushed );
            }
            if ( failed.getSize() == 1 )
            {
                resultBuilder.failed( contentService.getById( failed.first() ).getPath() );
            }
            else
            {
                resultBuilder.failed( failed );
            }
        }
        catch ( final Exception e )
        {
            resultBuilder.failed( contentIds );
        }

        progressReporter.info( resultBuilder.build().toJson() );
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static class Builder
        extends AbstractRunnableTask.Builder
    {
        private PublishContentJson params;

        public Builder params( PublishContentJson params )
        {
            this.params = params;
            return this;
        }

        @Override
        public Builder description( String description )
        {
            super.description( description );
            return this;
        }

        @Override
        public Builder taskService( TaskService taskService )
        {
            super.taskService( taskService );
            return this;
        }

        @Override
        public Builder contentService( ContentService contentService )
        {
            super.contentService( contentService );
            return this;
        }

        @Override
        public PublishRunnableTask build()
        {
            return new PublishRunnableTask( this );
        }
    }
}
