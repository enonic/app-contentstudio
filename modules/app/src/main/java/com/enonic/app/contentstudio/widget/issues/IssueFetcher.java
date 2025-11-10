package com.enonic.app.contentstudio.widget.issues;

import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.issue.FindIssuesResult;
import com.enonic.xp.issue.IssueQuery;
import com.enonic.xp.issue.IssueService;
import com.enonic.xp.issue.IssueStatus;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.security.PrincipalKeys;

public final class IssueFetcher
    implements ScriptBean
{
    private static Integer DEFAULT_FETCH_SIZE = 10;

    private IssueService issueService;
    public FindIssuesResult list( final Integer size, String principalKey)
    {
        final IssueQuery.Builder issueQuery = IssueQuery.create()
            .status( IssueStatus.OPEN )
            .from( 0 )
            .size( size );

        if (principalKey != null) {
            issueQuery.approvers( PrincipalKeys.from( principalKey ) );
        }

        return issueService.findIssues( issueQuery.build() );
    }

    public FindIssuesResult list()
    {
        return list( DEFAULT_FETCH_SIZE, ContextAccessor.current().getAuthInfo().getUser().getKey().toString() );
    }

    @Override
    public void initialize( final BeanContext context )
    {
        this.issueService = context.getService( IssueService.class ).get();
    }
}
