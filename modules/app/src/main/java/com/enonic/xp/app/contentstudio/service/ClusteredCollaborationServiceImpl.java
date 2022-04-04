package com.enonic.xp.app.contentstudio.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.IMap;

import com.enonic.xp.app.contentstudio.json.CollaborationParams;
import com.enonic.xp.event.Event;
import com.enonic.xp.event.EventPublisher;

@Component(immediate = true, service = CollaborationService.class)
public class ClusteredCollaborationServiceImpl
    implements CollaborationService
{
    private EventPublisher eventPublisher;

    private final IMap<String, Set<String>> contents;

    private final ScheduledExecutorService scheduledExecutorService;

    @Activate
    public ClusteredCollaborationServiceImpl( @Reference final HazelcastInstance hazelcastInstance )
    {
        this.contents = hazelcastInstance.getMap( "system.collaboration.contents" );
        this.scheduledExecutorService = Executors.newSingleThreadScheduledExecutor();

        this.scheduledExecutorService.scheduleAtFixedRate( () -> {
            long calledAt = Instant.now().toEpochMilli();

            contents.localKeySet().forEach( contentId -> {
                CopyOnWriteArraySet<String> newCollaborators = new CopyOnWriteArraySet<>();

                contents.lock( contentId );
                try
                {
                    Set<String> collaborationIds = contents.get( contentId );
                    int initialSize = collaborationIds.size();

                    collaborationIds.forEach( collaboratorId -> {
                        Long lastHeartbeat = extractLastHeartbeat( collaboratorId );
                        if ( calledAt - lastHeartbeat <= 2 * 60 * 1000 )
                        {
                            newCollaborators.add( collaboratorId );
                        }
                    } );
                    contents.put( contentId, newCollaborators );

                    if ( newCollaborators.size() - initialSize < 0 )
                    {
                        publishLeaveEvent( contentId, newCollaborators );
                    }
                }
                finally
                {
                    contents.unlock( contentId );
                }
            } );
        }, 15, 30, TimeUnit.SECONDS );
    }

    @Deactivate
    public void deactivate()
    {
        this.scheduledExecutorService.shutdown();
    }

    @Override
    public Set<String> join( final CollaborationParams params )
    {
        long joinAt = Instant.now().toEpochMilli();
        contents.lock( params.getContentId() );
        try
        {
            if ( !contents.containsKey( params.getContentId() ) )
            {
                contents.put( params.getContentId(), new CopyOnWriteArraySet<>() );
            }

            final Set<String> collaborators = contents.get( params.getContentId() );
            collaborators.add( generateCollaboratorId( params, joinAt ) );
            contents.put( params.getContentId(), collaborators );
            publishJoinEvent( params, collaborators );

            return collaborators;
        }
        finally
        {
            contents.unlock( params.getContentId() );
        }
    }

    @Override
    public Set<String> leave( final CollaborationParams params )
    {
        contents.lock( params.getContentId() );
        try
        {
            if ( !contents.containsKey( params.getContentId() ) )
            {
                contents.put( params.getContentId(), new CopyOnWriteArraySet<>() );
            }

            final Set<String> collaborators = contents.get( params.getContentId() );
            final boolean removed =
                collaborators.removeIf( collaboratorId -> collaboratorId.startsWith( params.getSessionId() + "=" + params.getUserKey() ) );
            contents.put( params.getContentId(), collaborators );

            if ( removed )
            {
                publishLeaveEvent( params.getContentId(), collaborators );
            }

            return collaborators;
        }
        finally
        {
            contents.unlock( params.getContentId() );
        }
    }

    @Override
    public Set<String> heartbeat( final CollaborationParams params )
    {
        long heartbeatAt = Instant.now().toEpochMilli();
        contents.lock( params.getContentId() );
        try
        {
            final Set<String> collaborators = contents.get( params.getContentId() );

            final Predicate<String> collaborationIdStartsWith =
                collaborationId -> collaborationId.startsWith( params.getSessionId() + "=" + params.getUserKey() );

            if ( collaborators.stream().noneMatch( collaborationIdStartsWith ) )
            {
                collaborators.add( generateCollaboratorId( params, heartbeatAt ) );
                publishJoinEvent( params, collaborators );
            }
            else
            {
                if ( collaborators.removeIf( collaborationIdStartsWith ) )
                {
                    collaborators.add( generateCollaboratorId( params, heartbeatAt ) );
                }
            }
            contents.put( params.getContentId(), collaborators );

            return collaborators;
        }
        finally
        {
            contents.unlock( params.getContentId() );
        }
    }

    private Map<String, Object> collaboratorAsMap( final String sessionId, final String userKey )
    {
        final Map<String, Object> result = new LinkedHashMap<>();
        result.put( "sessionId", sessionId );
        result.put( "userKey", userKey );
        return result;
    }

    private void publishJoinEvent( final CollaborationParams params, final Set<String> collaborators )
    {
        eventPublisher.publish( Event.create( "edit.content.new.collaborator" ).
            distributed( true ).
            value( "contentId", params.getContentId() ).
            value( "newCollaborator", collaboratorAsMap( params.getSessionId(), params.getUserKey() ) ).
            value( "collaborators", collaborators.stream().map( this::extractUserKey ).collect( Collectors.toSet() ) ).
            build() );
    }

    private void publishLeaveEvent( final String contentId, final Set<String> collaborators )
    {
        eventPublisher.publish( Event.create( "edit.content.remove.collaborator" ).
            distributed( true ).
            value( "contentId", contentId ).
            value( "collaborators", collaborators.stream().map( this::extractUserKey ).collect( Collectors.toSet() ) ).
            build() );
    }

    private String generateCollaboratorId( final CollaborationParams params, final long timestamp )
    {
        return params.getSessionId() + "=" + params.getUserKey() + "=" + timestamp;
    }

    private String extractUserKey( final String collaboratorId )
    {
        return collaboratorId.split( "=", -1 )[1];
    }

    private Long extractLastHeartbeat( final String collaboratorId )
    {
        String[] idParts = collaboratorId.split( "=", -1 );
        return Long.valueOf( idParts[2] );
    }

    @Reference
    public void setEventPublisher( final EventPublisher eventPublisher )
    {
        this.eventPublisher = eventPublisher;
    }
}
