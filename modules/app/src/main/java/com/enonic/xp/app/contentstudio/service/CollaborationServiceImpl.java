package com.enonic.xp.app.contentstudio.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.stream.Collectors;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.contentstudio.json.CollaborationParams;
import com.enonic.xp.app.contentstudio.json.CollaboratorJson;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.event.Event;
import com.enonic.xp.event.EventPublisher;

@Component(immediate = true)
public class CollaborationServiceImpl
    implements CollaborationService
{
    private EventPublisher eventPublisher;

    private final ConcurrentMap<ContentId, Set<CollaboratorJson>> contents = new ConcurrentHashMap<>();

    @Override
    public Set<CollaboratorJson> join( final CollaborationParams params )
    {
        final ContentId contentId = ContentId.from( params.getContentId() );

        final CollaboratorJson collaborator = new CollaboratorJson( params.getSessionId(), params.getUserKey() );

        final Set<CollaboratorJson> collaborators = contents.computeIfAbsent( contentId, f -> new CopyOnWriteArraySet<>() );
        collaborators.add( collaborator );

        eventPublisher.publish( Event.create( "edit.content.new.collaborator" ).
            distributed( true ).
            value( "contentId", contentId ).
            value( "newCollaborator", collaboratorAsMap( collaborator ) ).
            value( "collaborators", collaborators.stream().map( CollaboratorJson::getKey ).collect( Collectors.toSet() ) ).
            build() );

        return collaborators;
    }

    @Override
    public Set<CollaboratorJson> left( final CollaborationParams params )
    {
        final ContentId contentId = ContentId.from( params.getContentId() );

        final Set<CollaboratorJson> collaborators = contents.computeIfAbsent( contentId, f -> new CopyOnWriteArraySet<>() );

        final boolean removed = collaborators.removeIf( visitor -> Objects.equals( visitor.getKey(), params.getUserKey() ) &&
            Objects.equals( visitor.getSessionId(), params.getSessionId() ) );

        if ( removed )
        {
            eventPublisher.publish( Event.create( "edit.content.remove.collaborator" ).
                distributed( true ).
                value( "contentId", contentId ).
                value( "collaborators", collaborators.stream().map( CollaboratorJson::getKey ).collect( Collectors.toSet() ) ).
                build() );
        }

        return collaborators;
    }

    private Map<String, Object> collaboratorAsMap( final CollaboratorJson visitor )
    {
        final Map<String, Object> result = new LinkedHashMap<>();
        result.put( "sessionId", visitor.getSessionId() );
        result.put( "userKey", visitor.getKey() );
        return result;
    }

    @Reference
    public void setEventPublisher( final EventPublisher eventPublisher )
    {
        this.eventPublisher = eventPublisher;
    }
}
