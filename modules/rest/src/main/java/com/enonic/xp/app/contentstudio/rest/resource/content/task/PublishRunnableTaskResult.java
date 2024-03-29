package com.enonic.xp.app.contentstudio.rest.resource.content.task;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentPath;


public class PublishRunnableTaskResult
    extends RunnableTaskResult
{
    private final List<ContentPath> deleted;


    private PublishRunnableTaskResult( Builder builder )
    {
        super( builder );
        this.deleted = builder.deleted;
    }


    public List<ContentPath> getDeleted()
    {
        return deleted;
    }

    @Override
    public String getMessage()
    {
        return new PublishTaskMessageGenerator().generate( this );
    }

    @Override
    public int getSuccessCount()
    {
        return deleted.size() + super.getSuccessCount();
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static class Builder
        extends RunnableTaskResult.Builder<Builder>
    {
        private final List<ContentPath> deleted = new ArrayList<>();

        private Builder()
        {
            super();
        }

        public Builder deleted( ContentPath item )
        {
            this.deleted.add( item );
            return this;
        }

        public Builder deleted( ContentIds items )
        {
            this.deleted.addAll( items.stream().map( i -> ContentPath.from( i.toString() ) ).collect( Collectors.toList() ) );
            return this;
        }

        @Override
        public PublishRunnableTaskResult build()
        {
            return new PublishRunnableTaskResult( this );
        }
    }
}
