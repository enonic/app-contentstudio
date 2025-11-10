package com.enonic.app.contentstudio.json.content;

import java.util.LinkedHashSet;
import java.util.Set;

import com.enonic.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.app.contentstudio.rest.resource.content.versions.ActiveContentVersionEntry;
import com.enonic.app.contentstudio.rest.resource.content.versions.GetActiveContentVersionsResult;

public class GetActiveContentVersionsResultJson
{
    private final Set<ActiveContentVersionEntryJson> activeContentVersions = new LinkedHashSet<>();

    public GetActiveContentVersionsResultJson( final GetActiveContentVersionsResult result,
                                               final ContentPrincipalsResolver principalsResolver )
    {
        for ( final ActiveContentVersionEntry activeContentVersionEntry : result.getActiveContentVersions() )
        {
            activeContentVersions.add( new ActiveContentVersionEntryJson( activeContentVersionEntry, principalsResolver ) );
        }
    }

    @SuppressWarnings("UnusedDeclaration")
    public Set<ActiveContentVersionEntryJson> getActiveContentVersions()
    {
        return activeContentVersions;
    }
}
