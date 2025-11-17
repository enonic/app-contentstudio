package com.enonic.app.contentstudio.rest.resource.content.task;

import java.util.List;

import com.enonic.xp.content.ContentName;
import com.enonic.xp.content.ContentPath;

class DeleteTaskMessageGenerator
    extends TaskMessageGenerator<DeleteRunnableTaskResult>
{
    @Override
    String getNoResultsMessage()
    {
        return "Nothing to delete.";
    }

    @Override
    void appendMessageForSingleFailure( final StringBuilder builder, final DeleteRunnableTaskResult result )
    {
        builder.append( String.format( "Item \"%s\" could not be deleted.", result.getFailed().get( 0 ).getName() ) );
    }

    @Override
    void appendMessageForMultipleFailure( final StringBuilder builder, final DeleteRunnableTaskResult result )
    {
        builder.append( String.format( "Failed to delete %s items. ", result.getFailureCount() ) );
    }

    @Override
    void appendMessageForSingleSuccess( final StringBuilder builder, final DeleteRunnableTaskResult result )
    {
        final List<ContentPath> deleted = result.getSucceeded();
        if ( deleted != null && deleted.size() == 1 )
        {
            ContentName name = deleted.get( 0 ).getName();
            if ( name.isUnnamed() )
            {
                builder.append( "The item has been deleted" );
            }
            else
            {
                builder.append( String.format( "Item \"%s\" has been deleted.", name ) );
            }
        }
    }

    @Override
    void appendMessageForMultipleSuccess( final StringBuilder builder, final DeleteRunnableTaskResult result )
    {
        builder.append( String.format( "%s items have been deleted", result.getSuccessCount() ) );
        builder.append( "." );
    }

}
