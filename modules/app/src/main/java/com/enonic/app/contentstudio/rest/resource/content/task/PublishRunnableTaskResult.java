package com.enonic.app.contentstudio.rest.resource.content.task;

public class PublishRunnableTaskResult
    extends RunnableTaskResult
{

    private PublishRunnableTaskResult( Builder builder )
    {
        super( builder );
    }

    @Override
    public String getMessage()
    {
        return new PublishTaskMessageGenerator().generate( this );
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static class Builder
        extends RunnableTaskResult.Builder<Builder>
    {
        private Builder()
        {
            super();
        }

        @Override
        public PublishRunnableTaskResult build()
        {
            return new PublishRunnableTaskResult( this );
        }
    }
}
