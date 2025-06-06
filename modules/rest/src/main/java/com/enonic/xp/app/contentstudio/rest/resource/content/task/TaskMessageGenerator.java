package com.enonic.xp.app.contentstudio.rest.resource.content.task;

import java.util.List;

import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentPath;

abstract class TaskMessageGenerator<R extends RunnableTaskResult>
{
    String generate( final R result )
    {
        final int total = result.getTotalCount();
        if ( total == 0 )
        {
            return getNoResultsMessage();
        }

        final int totalSuccess = result.getSuccessCount();
        final int totalFailed = result.getFailureCount();
        final StringBuilder builder = new StringBuilder();

        if ( totalSuccess == 1 )
        {
            appendMessageForSingleSuccess( builder, result );
        }
        else if ( totalSuccess > 1 )
        {
            appendMessageForMultipleSuccess( builder, result );
        }

        if ( totalFailed > 0 )
        {
            if ( totalSuccess > 0 )
            {
                builder.append( " " );
            }
            if ( totalFailed == 1 )
            {
                appendMessageForSingleFailure( builder, result );
            }
            else
            {
                appendMessageForMultipleFailure( builder, result );
            }
        }

        return builder.toString();
    }

    abstract String getNoResultsMessage();

    abstract void appendMessageForMultipleFailure( StringBuilder builder, R result );

    abstract void appendMessageForSingleFailure( StringBuilder builder, R result );

    abstract void appendMessageForMultipleSuccess( StringBuilder builder, R result );

    abstract void appendMessageForSingleSuccess( StringBuilder builder, R result );

    String getNameOrSize( final List<ContentPath> items )
    {
        return items.size() != 1 ? String.valueOf( items.size() ) : String.format( "\"%s\"", items.get( 0 ).getName() );
    }

    String getNameOrSizeForIds( final List<ContentId> items )
    {
        return items.size() != 1 ? String.valueOf( items.size() ) : String.format( "\"%s\"", items.get( 0 ).toString() );
    }
}
