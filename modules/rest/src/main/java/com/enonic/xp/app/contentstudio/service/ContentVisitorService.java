package com.enonic.xp.app.contentstudio.service;

import java.util.Set;

import com.enonic.xp.app.contentstudio.json.content.ContentVisitorParams;
import com.enonic.xp.app.contentstudio.rest.resource.auth.json.UserJson;
import com.enonic.xp.content.ContentId;

public interface ContentVisitorService
{
    Set<UserJson> open( ContentVisitorParams params );

    Set<UserJson> close( ContentVisitorParams params );

    Set<UserJson> getUsers( ContentId contentId );
}
