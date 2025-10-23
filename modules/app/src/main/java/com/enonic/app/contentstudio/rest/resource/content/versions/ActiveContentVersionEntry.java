package com.enonic.app.contentstudio.rest.resource.content.versions;

import com.enonic.xp.branch.Branch;
import com.enonic.xp.content.ContentVersion;

public final class ActiveContentVersionEntry
{
    private final Branch branch;

    private final ContentVersion contentVersion;

    public static ActiveContentVersionEntry from( final Branch branch, final ContentVersion contentVersion )
    {
        return new ActiveContentVersionEntry( branch, contentVersion );
    }

    private ActiveContentVersionEntry( final Branch branch, final ContentVersion contentVersion )
    {
        this.branch = branch;
        this.contentVersion = contentVersion;
    }

    public ContentVersion getContentVersion()
    {
        return contentVersion;
    }

    public Branch getBranch()
    {
        return branch;
    }
}
