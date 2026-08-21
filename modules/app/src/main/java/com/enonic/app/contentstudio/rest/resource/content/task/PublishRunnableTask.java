package com.enonic.app.contentstudio.rest.resource.content.task;

import com.enonic.app.contentstudio.rest.resource.content.DefaultPageTemplateResolver;
import com.enonic.app.contentstudio.rest.resource.content.PublishContentProgressListener;
import com.enonic.app.contentstudio.rest.resource.content.json.PublishContentJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.PublishContentResult;
import com.enonic.xp.content.PushContentParams;
import com.enonic.xp.content.ResolvePublishDependenciesParams;
import com.enonic.app.contentstudio.json.task.AbstractRunnableTask;
import com.enonic.xp.page.PageTemplateService;
import com.enonic.xp.task.ProgressReporter;
import com.enonic.xp.task.TaskId;
import com.enonic.xp.task.TaskService;

public class PublishRunnableTask
    extends AbstractRunnableTask
{
    private final PublishContentJson params;

    private final PageTemplateService pageTemplateService;

    private PublishRunnableTask( Builder builder )
    {
        super( builder );
        this.params = builder.params;
        this.pageTemplateService = builder.pageTemplateService;
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
            // the templates the contents render with are not reachable from their data, so they have to be named explicitly
            final ContentIds templateIds = resolveDefaultPageTemplates( contentIds, excludeContentIds, excludeDescendantsOf );

            final PushContentParams.Builder builder = PushContentParams.create()
                .contentIds( ContentIds.create().addAll( contentIds ).addAll( templateIds ).build() )
                .excludedContentIds( excludeContentIds )
                // a template is published for itself, never for its children
                .excludeDescendantsOf( ContentIds.create().addAll( excludeDescendantsOf ).addAll( templateIds ).build() )
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

    /**
     * The publish dialog sends the selected contents only; children and dependencies are expanded again inside the publish itself. The
     * templates have to be resolved against that expanded set, so the resolution is repeated here to find them.
     */
    private ContentIds resolveDefaultPageTemplates( final ContentIds contentIds, final ContentIds excludeContentIds,
                                                    final ContentIds excludeDescendantsOf )
    {
        final ContentIds resolved = contentService.resolvePublishDependencies( ResolvePublishDependenciesParams.create()
                                                                                  .contentIds( contentIds )
                                                                                  .excludedContentIds( excludeContentIds )
                                                                                  .excludeDescendantsOf( excludeDescendantsOf )
                                                                                  .build() ).contentIds();

        return new DefaultPageTemplateResolver( contentService, pageTemplateService ).resolve( resolved )
            .stream()
            .filter( id -> !excludeContentIds.contains( id ) )
            .collect( ContentIds.collector() );
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static class Builder
        extends AbstractRunnableTask.Builder
    {
        private PublishContentJson params;

        private PageTemplateService pageTemplateService;

        public Builder params( PublishContentJson params )
        {
            this.params = params;
            return this;
        }

        public Builder pageTemplateService( PageTemplateService pageTemplateService )
        {
            this.pageTemplateService = pageTemplateService;
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
