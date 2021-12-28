package com.enonic.xp.app.contentstudio.service;

import java.util.Set;

import com.enonic.xp.app.contentstudio.json.VisitorJson;
import com.enonic.xp.app.contentstudio.json.VisitorParams;

public interface VisitorService
{
    Set<VisitorJson> open( final VisitorParams params );

    Set<VisitorJson> close( final VisitorParams params );
}
