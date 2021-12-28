package com.enonic.xp.app.contentstudio;

import com.enonic.xp.app.contentstudio.json.VisitorParams;

public class CloseContentHandler
    extends ContentVisitorHandler
{
    public VisitorsMapper execute()
    {
        final VisitorParams params = new VisitorParams();
        params.setContentId( contentId );
        params.setSessionId( sessionId );
        params.setUserKey( userKey );
        return new VisitorsMapper( contentVisitorServiceSupplier.get().close( params ) );
    }
}
