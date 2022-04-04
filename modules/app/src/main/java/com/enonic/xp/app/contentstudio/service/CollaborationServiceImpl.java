package com.enonic.xp.app.contentstudio.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.stream.Collectors;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.contentstudio.json.CollaborationParams;
import com.enonic.xp.event.Event;
import com.enonic.xp.event.EventPublisher;

@Component(immediate = true)
@Local
public class CollaborationServiceImpl
    implements CollaborationService
{
    private EventPublisher eventPublisher;

    private final ConcurrentMap<String, Set<String>> contents = new ConcurrentHashMap<>();

    @Override
    public Set<String> join( final CollaborationParams params )
    {
        long joinAt = Instant.now().toEpochMilli();

        final Set<String> collaborators = contents.computeIfAbsent( params.getContentId(), f -> new CopyOnWriteArraySet<>() );
        collaborators.add( generateCollaboratorId( params, joinAt ) );

        eventPublisher.publish( Event.create( "edit.content.new.collaborator" ).
            distributed( true ).
            value( "contentId", params.getContentId() ).
            value( "newCollaborator", collaboratorAsMap( params.getSessionId(), params.getUserKey() ) ).
            value( "collaborators", collaborators.stream().map( this::extractUserKey ).collect( Collectors.toSet() ) ).
            build() );

        return collaborators;
    }

    @Override
    public Set<String> leave( final CollaborationParams params )
    {
        final Set<String> collaborators = contents.computeIfAbsent( params.getContentId(), f -> new CopyOnWriteArraySet<>() );

        final boolean removed =
            collaborators.removeIf( collaboratorId -> collaboratorId.startsWith( params.getSessionId() + "=" + params.getUserKey() ) );

        if ( removed )
        {
            eventPublisher.publish( Event.create( "edit.content.remove.collaborator" ).
                distributed( true ).
                value( "contentId", params.getContentId() ).
                value( "collaborators", collaborators.stream().map( this::extractUserKey ).collect( Collectors.toSet() ) ).
                build() );
        }

        return collaborators;
    }

    @Override
    public Set<String> heartbeat( final CollaborationParams params )
    {
        return contents.get( params.getContentId() );
    }

    private Map<String, Object> collaboratorAsMap( final String sessionId, final String userKey )
    {
        final Map<String, Object> result = new LinkedHashMap<>();
        result.put( "sessionId", sessionId );
        result.put( "userKey", userKey );
        return result;
    }

    private String generateCollaboratorId( final CollaborationParams params, final long timestamp )
    {
        return params.getSessionId() + "=" + params.getUserKey() + "=" + timestamp;
    }

    private String extractUserKey( final String collaboratorId )
    {
        return collaboratorId.split( "=", -1 )[1];
    }

    @Reference
    public void setEventPublisher( final EventPublisher eventPublisher )
    {
        this.eventPublisher = eventPublisher;
    }
}
