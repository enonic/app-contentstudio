package com.enonic.xp.app.contentstudio.service;

import java.util.Set;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.component.annotations.ReferencePolicyOption;

import com.enonic.xp.app.contentstudio.json.CollaborationParams;
import com.enonic.xp.core.internal.concurrent.DynamicReference;

@Component(immediate = true)
public class CollaborationManagerImpl
    implements CollaborationManager
{
    private final CollaborationService localCollaborationService;

    private final DynamicReference<CollaborationService> clusteredCollaborationServiceRef = new DynamicReference<>();

    @Activate
    public CollaborationManagerImpl( @Reference(target = "(local=true)") final CollaborationService localCollaborationService )
    {
        this.localCollaborationService = localCollaborationService;
    }

    @Reference(cardinality = ReferenceCardinality.OPTIONAL, policy = ReferencePolicy.DYNAMIC, policyOption = ReferencePolicyOption.GREEDY, target = "(!(local=true))")
    public void setClusteredContentVisitorManagerRef( final CollaborationService clusteredManager )
    {
        this.clusteredCollaborationServiceRef.set( clusteredManager );
    }

    @Override
    public Set<String> join( final CollaborationParams params )
    {
        return getCollaborationService().join( params );
    }

    @Override
    public Set<String> leave( final CollaborationParams params )
    {
        return getCollaborationService().leave( params );
    }

    @Override
    public Set<String> heartbeat( final CollaborationParams params )
    {
        return getCollaborationService().heartbeat( params );
    }

    public void unsetClusteredContentVisitorManagerRef( final CollaborationService clusteredManager )
    {
        this.clusteredCollaborationServiceRef.reset();
    }

    private CollaborationService getCollaborationService()
    {
        return clusteredCollaborationServiceRef.getNow( localCollaborationService );
    }
}
