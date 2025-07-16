package com.enonic.xp.app.contentstudio.json.content;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.versions.ActiveContentVersionEntry;

public class ActiveContentVersionEntryJson
{
    private final String branch;

    private final ContentVersionJson contentVersion;

    public ActiveContentVersionEntryJson( final ActiveContentVersionEntry activeContentVersion,
                                          final ContentPrincipalsResolver principalsResolver )
    {
        this.branch = activeContentVersion.getBranch().getValue();
        this.contentVersion = new ContentVersionJson( activeContentVersion.getContentVersion(), principalsResolver );
    }

    @SuppressWarnings("UnusedDeclaration")
    public String getBranch()
    {
        return branch;
    }

    @SuppressWarnings("UnusedDeclaration")
    public ContentVersionJson getContentVersion()
    {
        return contentVersion;
    }
}
