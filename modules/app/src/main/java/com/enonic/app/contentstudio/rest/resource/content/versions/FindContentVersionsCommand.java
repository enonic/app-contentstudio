package com.enonic.app.contentstudio.rest.resource.content.versions;

import com.enonic.xp.content.ContentId;
import com.enonic.xp.node.GetNodeVersionsParams;
import com.enonic.xp.node.NodeId;
import com.enonic.xp.node.NodeService;
import com.enonic.xp.node.NodeVersionQueryResult;

public class FindContentVersionsCommand
{
    private final NodeService nodeService;

    public FindContentVersionsCommand( final NodeService nodeService )
    {
        this.nodeService = nodeService;
    }

    public FindContentVersionsResult getContentVersions( final ContentId contentId, final int from, final int size )
    {
        final NodeId nodeId = NodeId.from( contentId );

        final NodeVersionQueryResult nodeVersionQueryResult = nodeService.findVersions( GetNodeVersionsParams.create().
            nodeId( nodeId ).
            from( from ).
            size( size ).
            build() );

        final FindContentVersionsResult.Builder findContentVersionsResultBuilder = FindContentVersionsResult.create().
            totalHits( nodeVersionQueryResult.getTotalHits() );

        final ContentVersionFactory contentVersionFactory = new ContentVersionFactory( this.nodeService );

        final ContentVersions contentVersions = contentVersionFactory.create( nodeId, nodeVersionQueryResult.getNodeVersionMetadatas() );
        findContentVersionsResultBuilder.hits( contentVersions.getSize() );

        findContentVersionsResultBuilder.contentVersions( contentVersions );

        return findContentVersionsResultBuilder.build();
    }
}
