package com.enonic.app.contentstudio.rest.resource.content.task;

import java.util.List;

import com.enonic.xp.content.ContentName;
import com.enonic.xp.content.ContentPath;

class DuplicateTaskMessageGenerator
    extends TaskMessageGenerator<DuplicateRunnableTaskResult>
{
    @Override
    String getNoResultsMessage()
    {
        return "Nothing to duplicate.";
    }

    @Override
    void appendMessageForSingleFailure( final StringBuilder builder, final DuplicateRunnableTaskResult result )
    {
        builder.append( String.format( "Item \"%s\" could not be duplicated.", result.getFailed().get( 0 ).getName() ) );
    }

    @Override
    void appendMessageForMultipleFailure( final StringBuilder builder, final DuplicateRunnableTaskResult result )
    {
        builder.append( String.format( "Failed to duplicate %s items.", result.getFailureCount() ) );
    }

    @Override
    void appendMessageForSingleSuccess( final StringBuilder builder, final DuplicateRunnableTaskResult result )
    {
        final List<ContentPath> alreadyDuplicated = result.getAlreadyDuplicated();
        final List<ContentPath> succeeded = result.getSucceeded();
        if ( alreadyDuplicated != null && alreadyDuplicated.size() == 1 )
        {
            builder.append( String.format( "Item \"%s\" has already been duplicated.", alreadyDuplicated.get( 0 ).getName() ) );
        }
        else if ( succeeded != null && succeeded.size() == 1 )
        {
            ContentName name = succeeded.get( 0 ).getName();
            if ( name.isUnnamed() )
            {
                builder.append( "The item has been duplicated" );
            }
            else
            {
                builder.append( String.format( "Item \"%s\" has been duplicated.", name ) );
            }
        }
    }

    @Override
    void appendMessageForMultipleSuccess( final StringBuilder builder, final DuplicateRunnableTaskResult result )
    {
        final List<ContentPath> alreadyDuplicated = result.getAlreadyDuplicated();
        builder.append( String.format( "%s items have been duplicated", result.getSuccessCount() ) );
        if ( alreadyDuplicated.size() > 0 )
        {
            builder.append( String.format( " ( Already duplicated: %s )", getNameOrSize( alreadyDuplicated ) ) );
        }
        builder.append( "." );
    }

}
