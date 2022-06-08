package com.enonic.xp.app.contentstudio;

import java.util.function.Supplier;

import com.enonic.xp.app.contentstudio.json.CollaborationParams;
import com.enonic.xp.app.contentstudio.service.CollaborationManager;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;

public class CollaborationHandler
    implements ScriptBean
{
    protected Supplier<CollaborationManager> collaborationManagerSupplier;

    protected String contentId;

    protected String sessionId;

    protected String userKey;

    @Override
    public void initialize( final BeanContext beanContext )
    {
        this.collaborationManagerSupplier = beanContext.getService( CollaborationManager.class );
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

    public CollaborationsMapper join()
    {
        final CollaborationParams params = new CollaborationParams();
        params.setContentId( contentId );
        params.setSessionId( sessionId );
        params.setUserKey( userKey );
        return new CollaborationsMapper( collaborationManagerSupplier.get().join( params ) );
    }

    public CollaborationsMapper leave()
    {
        final CollaborationParams params = new CollaborationParams();
        params.setContentId( contentId );
        params.setSessionId( sessionId );
        params.setUserKey( userKey );
        return new CollaborationsMapper( collaborationManagerSupplier.get().leave( params ) );
    }

    public CollaborationsMapper heartbeat()
    {
        final CollaborationParams params = new CollaborationParams();
        params.setContentId( contentId );
        params.setSessionId( sessionId );
        params.setUserKey( userKey );
        return new CollaborationsMapper( collaborationManagerSupplier.get().heartbeat( params ) );
    }
}
