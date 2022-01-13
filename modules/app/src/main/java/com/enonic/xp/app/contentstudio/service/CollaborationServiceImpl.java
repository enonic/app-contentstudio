package com.enonic.xp.app.contentstudio.service;

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
import com.enonic.xp.content.ContentId;
import com.enonic.xp.event.Event;
import com.enonic.xp.event.EventPublisher;

@Component(immediate = true)
public class CollaborationServiceImpl
    implements CollaborationService
{
    private EventPublisher eventPublisher;

    private final ConcurrentMap<ContentId, Set<String>> contents = new ConcurrentHashMap<>();

    @Override
    public Set<String> join( final CollaborationParams params )
    {
        final ContentId contentId = ContentId.from( params.getContentId() );

        final Set<String> collaborators = contents.computeIfAbsent( contentId, f -> new CopyOnWriteArraySet<>() );
        collaborators.add( generateCollaboratorId( params ) );

        eventPublisher.publish( Event.create( "edit.content.new.collaborator" ).
            distributed( true ).
            value( "contentId", contentId ).
            value( "newCollaborator", collaboratorAsMap( params.getSessionId(), params.getUserKey() ) ).
            value( "collaborators", collaborators.stream().map( this::extractUserKey ).collect( Collectors.toSet() ) ).
            build() );

        return collaborators;
    }

    @Override
    public Set<String> left( final CollaborationParams params )
    {
        final ContentId contentId = ContentId.from( params.getContentId() );

        final Set<String> collaborators = contents.computeIfAbsent( contentId, f -> new CopyOnWriteArraySet<>() );

        final boolean removed = collaborators.removeIf( collaboratorId -> collaboratorId.equals( generateCollaboratorId( params ) ) );

        if ( removed )
        {
            eventPublisher.publish( Event.create( "edit.content.remove.collaborator" ).
                distributed( true ).
                value( "contentId", contentId ).
                value( "collaborators", collaborators.stream().map( this::extractUserKey ).collect( Collectors.toSet() ) ).
                build() );
        }

        return collaborators;
    }

    private Map<String, Object> collaboratorAsMap( final String sessionId, final String userKey )
    {
        final Map<String, Object> result = new LinkedHashMap<>();
        result.put( "sessionId", sessionId );
        result.put( "userKey", userKey );
        return result;
    }

    private String generateCollaboratorId( final CollaborationParams params )
    {
        return params.getSessionId() + "=" + params.getUserKey();
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
