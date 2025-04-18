package com.enonic.xp.app.contentstudio.rest.resource.content.task;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.jr.ob.JSON;

import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentPath;

enum TaskResultState
{
    SUCCESS, WARNING, ERROR
}

public class RunnableTaskResult
{
    private final List<ContentPath> succeeded;

    private final List<ContentPath> failed;

    RunnableTaskResult( Builder builder )
    {
        this.succeeded = builder.succeeded;
        this.failed = builder.failed;
    }

    public TaskResultState getState()
    {
        if ( getTotalCount() > 0 && getFailureCount() == 0 )
        {
            return TaskResultState.SUCCESS;
        }
        else if ( getTotalCount() > 0 && getSuccessCount() == 0 )
        {
            return TaskResultState.ERROR;
        }
        else
        {
            return TaskResultState.WARNING;
        }
    }

    public String getMessage()
    {
        return "";
    }

    public int getTotalCount()
    {
        return getSuccessCount() + getFailureCount();
    }

    public int getSuccessCount()
    {
        return succeeded.size();
    }

    public int getFailureCount()
    {
        return failed.size();
    }

    public List<ContentPath> getFailed()
    {
        return failed;
    }

    public List<ContentPath> getSucceeded()
    {
        return succeeded;
    }

    public String toJson()
    {
        try
        {
            return JSON.std.composeString()
                .startObject()
                .put( "state", getState().toString() )
                .put( "message", getMessage() )
                .end()
                .finish();
        }
        catch ( IOException e )
        {
            throw new UncheckedIOException( "Failed to make a JSON", e );
        }
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static class Builder<B extends Builder>
    {
        protected List<ContentPath> succeeded = new ArrayList<>();

        protected List<ContentPath> failed = new ArrayList<>();

        Builder()
        {
        }

        public B succeeded( ContentPath item )
        {
            this.succeeded.add( item );
            return (B) this;
        }

        public B succeeded( ContentIds items )
        {
            this.succeeded.addAll( items.stream().map( i -> ContentPath.from( i.toString() ) ).collect( Collectors.toList() ) );
            return (B) this;
        }

        public B failed( ContentPath item )
        {
            this.failed.add( item );
            return (B) this;
        }

        public B failed( ContentIds items )
        {
            this.failed.addAll( items.stream().map( i -> ContentPath.from( i.toString() ) ).collect( Collectors.toList() ) );
            return (B) this;
        }

        public RunnableTaskResult build()
        {
            return new RunnableTaskResult( this );
        }
    }
}
