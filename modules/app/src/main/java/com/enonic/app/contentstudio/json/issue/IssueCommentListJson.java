package com.enonic.app.contentstudio.json.issue;

import java.util.List;
import java.util.stream.Collectors;

import com.enonic.app.contentstudio.rest.resource.issue.IssueListMetaData;
import com.enonic.xp.issue.IssueComment;

public class IssueCommentListJson
{
    private final List<IssueCommentJson> issueComments;

    private final IssueListMetaDataJson metadata;

    public IssueCommentListJson( final List<IssueComment> issueCommments, final IssueListMetaData metadata )
    {
        this.issueComments = issueCommments.stream().map( IssueCommentJson::new ).collect( Collectors.toList() );
        this.metadata = new IssueListMetaDataJson( metadata );
    }

    public List<IssueCommentJson> getIssueComments()
    {
        return issueComments;
    }

    public IssueListMetaDataJson getMetadata()
    {
        return metadata;
    }
}
