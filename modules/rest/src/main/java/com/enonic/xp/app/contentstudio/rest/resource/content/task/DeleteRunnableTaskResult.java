package com.enonic.xp.app.contentstudio.rest.resource.content.task;

public class DeleteRunnableTaskResult
    extends RunnableTaskResult
{

    private DeleteRunnableTaskResult( Builder builder )
    {
        super( builder );
    }


    @Override
    public String getMessage()
    {
        return new DeleteTaskMessageGenerator().generate( this );
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
        public DeleteRunnableTaskResult build()
        {
            return new DeleteRunnableTaskResult( this );
        }
    }
}
