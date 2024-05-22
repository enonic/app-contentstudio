package com.enonic.xp.app.contentstudio.rest.resource.content.task;

import com.enonic.xp.app.contentstudio.rest.resource.content.ApplyPermissionsProgressListener;
import com.enonic.xp.content.ApplyContentPermissionsParams;
import com.enonic.xp.content.ApplyContentPermissionsResult;
import com.enonic.xp.content.ApplyPermissionsListener;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.FindContentByParentParams;
import com.enonic.xp.content.FindContentIdsByParentResult;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.task.AbstractRunnableTask;
import com.enonic.xp.task.ProgressReporter;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;

public class ApplyPermissionsRunnableTask
    extends AbstractRunnableTask
{
    private final ApplyContentPermissionsParams params;

    private ApplyPermissionsRunnableTask( Builder builder )
    {
        super( builder );
        this.params = builder.params;
    }

    public static Builder create()
    {
        return new Builder();
    }

    @Override
    public void run( final TaskId id, final ProgressReporter progressReporter )
    {
        final ApplyPermissionsListener listener = new ApplyPermissionsProgressListener( progressReporter );

        final FindContentIdsByParentResult children = this.contentService.findIdsByParent(
            FindContentByParentParams.create().size( -1 ).recursive( true ).parentId( params.getContentId() ).build() );

        listener.setTotal( ( (Long) children.getTotalHits() ).intValue() + 1 );

        final ApplyContentPermissionsResult result = contentService.applyPermissions( ApplyContentPermissionsParams.create()
                                                                                          .contentId( params.getContentId() )
                                                                                          .permissions( params.getPermissions() )
                                                                                          .addPermissions( params.getAddPermissions() )
                                                                                          .removePermissions(
                                                                                              params.getRemovePermissions() )
                                                                                          .applyPermissionsScope( params.getScope() )
                                                                                          .applyContentPermissionsListener( listener )
                                                                                          .build() );

        final ApplyPermissionsRunnableTaskResult taskResult = createTaskResult( result );

        progressReporter.info( taskResult.toJson() );
    }

    private ApplyPermissionsRunnableTaskResult createTaskResult( final ApplyContentPermissionsResult result )
    {
        final ApplyPermissionsRunnableTaskResult.Builder builder = ApplyPermissionsRunnableTaskResult.create();

        result.getResults().entrySet().forEach( branchResultEntry -> {
            branchResultEntry.getValue().forEach( branchResult -> {
                if ( ContextAccessor.current().getBranch().equals( branchResult.getBranch() ) )
                {
                    if ( branchResult.getContent() != null )
                    {
                        builder.succeeded( branchResult.getContent().getPath() );
                    }
                    else
                    {
                        builder.failed( ContentIds.from( branchResultEntry.getKey() ) );
                    }
                }
            } );
        } );

        return builder.build();
    }

    public static class Builder
        extends AbstractRunnableTask.Builder
    {
        private ApplyContentPermissionsParams params;

        public Builder params( ApplyContentPermissionsParams params )
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
        public ApplyPermissionsRunnableTask build()
        {
            return new ApplyPermissionsRunnableTask( this );
        }
    }
}
