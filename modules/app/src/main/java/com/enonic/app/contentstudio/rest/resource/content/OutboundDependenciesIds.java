package com.enonic.app.contentstudio.rest.resource.content;

import com.enonic.xp.content.ContentIds;

class OutboundDependenciesIds
{
    private final ContentIds existingOutboundIds;

    private final ContentIds nonExistingOutboundIds;

    OutboundDependenciesIds( final ContentIds existingIds, final ContentIds nonExistingIds )
    {
        this.existingOutboundIds = existingIds;
        this.nonExistingOutboundIds = nonExistingIds;
    }

    ContentIds getExistingOutboundIds()
    {
        return existingOutboundIds;
    }

    ContentIds getNonExistingOutboundIds()
    {
        return nonExistingOutboundIds;
    }

}
