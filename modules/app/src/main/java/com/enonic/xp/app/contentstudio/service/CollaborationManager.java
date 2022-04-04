package com.enonic.xp.app.contentstudio.service;

import java.util.Set;

import com.enonic.xp.app.contentstudio.json.CollaborationParams;

public interface CollaborationManager
{
    Set<String> join( final CollaborationParams params );

    Set<String> leave( final CollaborationParams params );

    Set<String> heartbeat( final CollaborationParams params );
}
