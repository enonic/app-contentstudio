package com.enonic.xp.app.contentstudio;

import java.util.Set;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.enonic.xp.app.contentstudio.json.CollaborationParams;
import com.enonic.xp.app.contentstudio.service.CollaborationService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;

import static java.util.Objects.requireNonNullElse;

public class CollaborationHandler
    implements ScriptBean
{
    private static final Logger LOG = LoggerFactory.getLogger( CollaborationHandler.class );

    protected Supplier<CollaborationService> collaborationServiceSupplier;

    protected String contentId;

    protected String sessionId;

    protected String userKey;

    @Override
    public void initialize( final BeanContext beanContext )
    {
        this.collaborationServiceSupplier = beanContext.getService( CollaborationService.class );
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
        final Set<String> collaborators = collaborationServiceSupplier.get().join( params );
        LOG.debug( "Collaborators after join {}", collaborators );

        return new CollaborationsMapper( collaborators );
    }

    public CollaborationsMapper leave()
    {
        final CollaborationParams params = new CollaborationParams();
        params.setContentId( contentId );
        params.setSessionId( sessionId );
        params.setUserKey( userKey );

        final Set<String> collaborators = requireNonNullElse( collaborationServiceSupplier.get().leave( params ), Set.of() );
        LOG.debug( "Collaborators after leave {}", collaborators );
        return new CollaborationsMapper( collaborators );
    }

    public CollaborationsMapper heartbeat()
    {
        final CollaborationParams params = new CollaborationParams();
        params.setContentId( contentId );
        params.setSessionId( sessionId );
        params.setUserKey( userKey );

        final Set<String> collaborators = collaborationServiceSupplier.get().join( params );
        LOG.debug( "Collaborators after heartbeat {}", collaborators );

        return new CollaborationsMapper( collaborators );
    }
}
