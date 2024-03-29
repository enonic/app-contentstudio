package com.enonic.xp.app.contentstudio.rest.resource.issue;

import com.enonic.xp.security.User;

public class IssueCommentedNotificationParams
    extends IssueNotificationParams
{
    private final User modifier;

    public IssueCommentedNotificationParams( final Builder builder )
    {
        super( builder );
        this.modifier = builder.modifier;
    }

    public User getModifier()
    {
        return modifier;
    }

    public static Builder create( final User modifier, final IssueNotificationParams source )
    {
        return new Builder( modifier, source );
    }

    public static class Builder
        extends IssueNotificationParams.Builder<Builder>
    {
        private final User modifier;

        private Builder( final User modifier, final IssueNotificationParams source )
        {
            super( source );
            this.modifier = modifier;
        }

        @Override
        public IssueCommentedNotificationParams build()
        {
            return new IssueCommentedNotificationParams( this );
        }
    }
}
