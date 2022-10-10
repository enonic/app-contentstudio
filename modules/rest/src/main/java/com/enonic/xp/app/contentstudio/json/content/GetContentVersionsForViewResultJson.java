package com.enonic.xp.app.contentstudio.json.content;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.content.ActiveContentVersionEntry;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentVersion;
import com.enonic.xp.content.FindContentVersionsResult;
import com.enonic.xp.content.GetActiveContentVersionsResult;

public class GetContentVersionsForViewResultJson
{
    private ActiveContentVersionEntryJson activeVersion;

    private final Set<ContentVersionViewJson> contentVersions = new LinkedHashSet<>();

    private final long totalHits;

    private final long hits;

    private final int from;

    private final int size;

    public GetContentVersionsForViewResultJson( final FindContentVersionsResult allVersions,
                                                final GetActiveContentVersionsResult activeVersions,
                                                final ContentPrincipalsResolver principalsResolver )
    {
        this.totalHits = allVersions.getTotalHits();
        this.from = allVersions.getFrom();
        this.size = allVersions.getSize();
        this.hits = allVersions.getHits();

        for ( final ContentVersion contentVersion : allVersions.getContentVersions() )
        {
            this.contentVersions.add(
                new ContentVersionViewJson( contentVersion, principalsResolver, findWorkspaces( contentVersion, activeVersions ) ) );
        }

        final ActiveContentVersionEntry activeVersion = getActiveContentVersion( activeVersions );

        if ( activeVersion != null )
        {
            this.activeVersion = new ActiveContentVersionEntryJson( activeVersion, principalsResolver );
        }
    }

    private List<String> findWorkspaces( final ContentVersion contentVersion, final GetActiveContentVersionsResult activeVersions )
    {
        final List<String> result = new ArrayList<>();
        activeVersions.getActiveContentVersions()
            .stream()
            .filter( activeVersion -> activeVersion.getContentVersion().getId().equals( contentVersion.getId() ) )
            .forEach( activeVersion -> result.add( activeVersion.getBranch().toString() ) );
        return result;
    }

    private ActiveContentVersionEntry getActiveContentVersion( final GetActiveContentVersionsResult activeVersions )
    {
        return activeVersions.getActiveContentVersions()
            .stream()
            .filter( activeVersion -> ContentConstants.BRANCH_DRAFT.equals( activeVersion.getBranch() ) )
            .findFirst()
            .orElse( null );
    }

    @SuppressWarnings("UnusedDeclaration")
    public ActiveContentVersionEntryJson getActiveVersion()
    {
        return activeVersion;
    }

    @SuppressWarnings("UnusedDeclaration")
    public Set<ContentVersionViewJson> getContentVersions()
    {
        return contentVersions;
    }

    public long getTotalHits()
    {
        return totalHits;
    }

    public long getHits()
    {
        return hits;
    }

    public int getFrom()
    {
        return from;
    }

    public int getSize()
    {
        return size;
    }
}
