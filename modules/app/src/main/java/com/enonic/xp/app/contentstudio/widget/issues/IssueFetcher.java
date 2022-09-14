package com.enonic.xp.app.contentstudio.widget.issues;

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

    public FindIssuesResult list( final Integer size )
    {
        final IssueQuery issueQuery = IssueQuery.create()
            .approvers( PrincipalKeys.from( ContextAccessor.current().getAuthInfo().getUser().getKey() ) )
            .status( IssueStatus.OPEN )
            .from( 0 )
            .size( size )
            .build();

        return issueService.findIssues( issueQuery );
    }

    public FindIssuesResult list()
    {
        return list( DEFAULT_FETCH_SIZE );
    }

    @Override
    public void initialize( final BeanContext context )
    {
        this.issueService = context.getService( IssueService.class ).get();
    }
}
