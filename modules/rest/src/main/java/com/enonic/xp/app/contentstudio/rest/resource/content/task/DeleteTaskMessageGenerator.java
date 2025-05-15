package com.enonic.xp.app.contentstudio.rest.resource.content.task;

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
            ContentName name = ContentName.from( deleted.get( 0 ).getName() );
            if ( name.isUnnamed() )
            {
                builder.append( "Item is deleted" );
            }
            else
            {
                builder.append( String.format( "Item \"%s\" is deleted.", name ) );
            }
        }
    }

    @Override
    void appendMessageForMultipleSuccess( final StringBuilder builder, final DeleteRunnableTaskResult result )
    {
        builder.append( String.format( "%s items are deleted", result.getSuccessCount() ) );
        builder.append( "." );
    }

}
