package com.enonic.xp.app.contentstudio.service;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

import org.osgi.service.component.annotations.Component;

import com.enonic.xp.app.contentstudio.json.content.ContentVisitorParams;
import com.enonic.xp.app.contentstudio.rest.resource.auth.json.UserJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.security.User;

@Component(service = ContentVisitorService.class)
public class ContentVisitorServiceImpl
    implements ContentVisitorService
{
    private final ConcurrentMap<ContentId, Set<User>> contents = new ConcurrentHashMap<>();

    @Override
    public Set<UserJson> open( final ContentVisitorParams params )
    {
        getUsersByContent( params.getContentId() ).add( ContextAccessor.current().getAuthInfo().getUser() );
        return contents.get( params.getContentId() ).stream().map( UserJson::new ).collect( Collectors.toSet() );
    }

    @Override
    public Set<UserJson> close( final ContentVisitorParams params )
    {
        getUsersByContent( params.getContentId() ).remove( ContextAccessor.current().getAuthInfo().getUser() );
        return contents.get( params.getContentId() ).stream().map( UserJson::new ).collect( Collectors.toSet() );
    }

    @Override
    public Set<UserJson> getUsers( final ContentId contentId )
    {
        return getUsersByContent( contentId ).stream().map( UserJson::new ).collect( Collectors.toSet() );
    }

    private Set<User> getUsersByContent( final ContentId contentId )
    {
        return contents.computeIfAbsent( contentId, f -> new HashSet<>() );
    }
}
