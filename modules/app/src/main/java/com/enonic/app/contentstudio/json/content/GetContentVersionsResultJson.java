package com.enonic.app.contentstudio.json.content;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.enonic.app.contentstudio.rest.resource.content.ContentPrincipalsResolver;
import com.enonic.app.contentstudio.rest.resource.content.ContentPublishInfoResolver;
import com.enonic.xp.content.ContentVersion;
import com.enonic.xp.content.ContentVersionId;
import com.enonic.xp.content.GetContentVersionsResult;

public class GetContentVersionsResultJson
{
    private final List<ContentVersionJson> contentVersions = new ArrayList<>();

    private final String cursor;

    private final String onlineVersionId;

    public GetContentVersionsResultJson( final GetContentVersionsResult result, final ContentVersionId onlineVersionId,
                                         final ContentPrincipalsResolver principalsResolver,
                                         final ContentPublishInfoResolver contentPublishInfoResolver )
    {
        this.cursor = result.getCursor();
        this.onlineVersionId = onlineVersionId != null ? onlineVersionId.toString() : null;

        final Set<ContentVersionId> batchVersionIds =
            result.getContentVersions().stream().map( ContentVersion::versionId ).collect( Collectors.toUnmodifiableSet() );

        for ( final ContentVersion contentVersion : result.getContentVersions() )
        {
            this.contentVersions.add(
                new ContentVersionJson( contentVersion, batchVersionIds, principalsResolver, contentPublishInfoResolver ) );
        }
    }

    @SuppressWarnings("UnusedDeclaration")
    public List<ContentVersionJson> getContentVersions()
    {
        return contentVersions;
    }

    public String getCursor()
    {
        return cursor;
    }

    public String getOnlineVersionId()
    {
        return onlineVersionId;
    }
}
