package com.enonic.xp.app.contentstudio.rest.resource.content.versions;

import java.util.Map;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.branch.Branches;
import com.enonic.xp.content.ActiveContentVersionEntry;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.GetActiveContentVersionsResult;
import com.enonic.xp.node.GetActiveNodeVersionsParams;
import com.enonic.xp.node.GetActiveNodeVersionsResult;
import com.enonic.xp.node.NodeId;
import com.enonic.xp.node.NodeService;
import com.enonic.xp.node.NodeVersionMetadata;

public class GetActiveContentVersionsCommand
{
    private final NodeService nodeService;


    public GetActiveContentVersionsCommand( final NodeService nodeService )
    {
        this.nodeService = nodeService;
    }

    public GetActiveContentVersionsResult getActiveVersions( final ContentId contentId, final Branches branches )
    {
        final NodeId nodeId = NodeId.from( contentId );

        final GetActiveNodeVersionsResult activeNodeVersions =
            this.nodeService.getActiveVersions( GetActiveNodeVersionsParams.create().nodeId( nodeId ).branches( branches ).build() );

        final ContentVersionFactory contentVersionFactory = new ContentVersionFactory( this.nodeService );

        final GetActiveContentVersionsResult.Builder builder = GetActiveContentVersionsResult.create();

        final Map<Branch, NodeVersionMetadata> nodeVersionsMap = activeNodeVersions.getNodeVersions();
        for ( final Branch branch : nodeVersionsMap.keySet() )
        {
            final NodeVersionMetadata nodeVersionMetadata = nodeVersionsMap.get( branch );
            builder.add( ActiveContentVersionEntry.from( branch, contentVersionFactory.create( nodeVersionMetadata ) ) );
        }

        return builder.build();
    }

}
