package com.enonic.xp.app.contentstudio.service;

import java.util.Set;

import com.enonic.xp.app.contentstudio.json.CollaboratorJson;
import com.enonic.xp.app.contentstudio.json.CollaborationParams;

public interface CollaborationService
{
    Set<CollaboratorJson> join( final CollaborationParams params );

    Set<CollaboratorJson> left( final CollaborationParams params );
}
