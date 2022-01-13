package com.enonic.xp.app.contentstudio.service;

import java.util.Set;

import com.enonic.xp.app.contentstudio.json.CollaborationParams;

public interface CollaborationService
{
    Set<String> join( final CollaborationParams params );

    Set<String> left( final CollaborationParams params );
}
