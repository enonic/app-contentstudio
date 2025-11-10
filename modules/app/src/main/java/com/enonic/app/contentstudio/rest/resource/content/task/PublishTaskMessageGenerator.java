package com.enonic.app.contentstudio.rest.resource.content.task;

import java.util.List;

import com.enonic.xp.content.ContentPath;

class PublishTaskMessageGenerator
    extends TaskMessageGenerator<PublishRunnableTaskResult>
{
    @Override
    String getNoResultsMessage()
    {
        return "Nothing to publish.";
    }

    @Override
    void appendMessageForSingleFailure( final StringBuilder builder, final PublishRunnableTaskResult result )
    {
        builder.append( String.format( "Item \"%s\" could not be published.", result.getFailed().get( 0 ).getName() ) );
    }

    @Override
    void appendMessageForMultipleFailure( final StringBuilder builder, final PublishRunnableTaskResult result )
    {
        builder.append( String.format( "Failed to publish %s items. ", result.getFailureCount() ) );
    }

    @Override
    void appendMessageForSingleSuccess( final StringBuilder builder, final PublishRunnableTaskResult result )
    {
        final List<ContentPath> published = result.getSucceeded();
         if ( published != null && published.size() == 1 )
        {
            builder.append( String.format( "Item \"%s\" is published.", published.get( 0 ).getName() ) );
        }
    }

    @Override
    void appendMessageForMultipleSuccess( final StringBuilder builder, final PublishRunnableTaskResult result )
    {
        builder.append( String.format( "%s items are published", result.getSuccessCount() ) );
        builder.append( "." );
    }

}
