package com.enonic.app.contentstudio.json.content;

import java.util.List;

import com.google.common.collect.ImmutableList;

import com.enonic.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.app.contentstudio.rest.resource.content.versions.ContentVersion;

public class ContentVersionViewJson
    extends ContentVersionJson
{
    private final ImmutableList<String> workspaces;

    public ContentVersionViewJson( final ContentVersion contentVersion, final ContentPrincipalsResolver resolver,
                                   final List<String> workspaces )
    {
        super( contentVersion, resolver );
        this.workspaces = ImmutableList.copyOf( workspaces );
    }

    @SuppressWarnings("UnusedDeclaration")
    public ImmutableList<String> getWorkspaces()
    {
        return workspaces;
    }
}
