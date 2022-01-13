package com.enonic.xp.app.contentstudio;

import java.util.function.Supplier;

import com.enonic.xp.app.contentstudio.json.CollaborationParams;
import com.enonic.xp.app.contentstudio.service.CollaborationService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;

public class CollaborationHandler
    implements ScriptBean
{
    protected Supplier<CollaborationService> contentVisitorServiceSupplier;

    protected String contentId;

    protected String sessionId;

    protected String userKey;

    @Override
    public void initialize( final BeanContext beanContext )
    {
        this.contentVisitorServiceSupplier = beanContext.getService( CollaborationService.class );
    }

    public void setContentId( final String contentId )
    {
        this.contentId = contentId;
    }

    public void setSessionId( final String sessionId )
    {
        this.sessionId = sessionId;
    }

    public void setUserKey( final String userKey )
    {
        this.userKey = userKey;
    }

    public CollaborationMapper join()
    {
        final CollaborationParams params = new CollaborationParams();
        params.setContentId( contentId );
        params.setSessionId( sessionId );
        params.setUserKey( userKey );
        return new CollaborationMapper( contentVisitorServiceSupplier.get().join( params ) );
    }

    public CollaborationMapper left()
    {
        final CollaborationParams params = new CollaborationParams();
        params.setContentId( contentId );
        params.setSessionId( sessionId );
        params.setUserKey( userKey );
        return new CollaborationMapper( contentVisitorServiceSupplier.get().left( params ) );
    }
}
