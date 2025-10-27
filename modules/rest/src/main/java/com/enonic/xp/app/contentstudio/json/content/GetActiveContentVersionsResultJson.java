package com.enonic.xp.app.contentstudio.json.content;

import java.util.LinkedHashSet;
import java.util.Set;

import com.enonic.xp.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.xp.app.contentstudio.rest.resource.content.versions.ActiveContentVersionEntry;
import com.enonic.xp.app.contentstudio.rest.resource.content.versions.GetActiveContentVersionsResult;

@Deprecated
public class GetActiveContentVersionsResultJson
{
    private final Set<ActiveContentVersionEntryJson> activeContentVersions = new LinkedHashSet<>();

    public GetActiveContentVersionsResultJson()
    {
    }

    @SuppressWarnings("UnusedDeclaration")
    public Set<ActiveContentVersionEntryJson> getActiveContentVersions()
    {
        return activeContentVersions;
    }
}
