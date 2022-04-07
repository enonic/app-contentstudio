package com.enonic.xp.app.contentstudio.service;

import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.enonic.xp.app.contentstudio.json.CollaborationParams;
import com.enonic.xp.event.Event;
import com.enonic.xp.event.EventPublisher;
import com.enonic.xp.shared.SharedMap;
import com.enonic.xp.shared.SharedMapService;

@Component(immediate = true)
public class CollaborationServiceImpl
    implements CollaborationService
{
    public static final int CONTENT_COLLABORATORS_TTL = (int) Duration.ofMinutes( 2 ).toSeconds();

    private final SharedMap<String, Set<String>> contents;

    private final EventPublisher eventPublisher;

    @Activate
    public CollaborationServiceImpl( @Reference final SharedMapService sharedMapService, @Reference final EventPublisher eventPublisher )
    {
        this.eventPublisher = eventPublisher;

        this.contents = sharedMapService.getSharedMap( "contentstudio.collaboration.contents" );
    }

    @Override
    public Set<String> join( final CollaborationParams params )
    {
        final long now = System.currentTimeMillis();
        final String collaboratorKey = collaboratorKey( params );
        final String contentId = params.getContentId();

        return contents.modify( contentId, collaborators -> {
            if ( collaborators == null )
            {
                collaborators = new LinkedHashSet<>();
            }
            else
            {
                collaborators = new LinkedHashSet<>( collaborators );
            }
            final boolean removedExpired = removeExpired( collaborators, now );

            boolean removedExisting = removeByKey( collaborators, collaboratorKey );

            collaborators.add( collaboratorKey + "=" + now );

            if ( !removedExisting || removedExpired )
            {
                publishEvent( contentId, collaborators );
            }
            return collaborators;
        }, CONTENT_COLLABORATORS_TTL );
    }

    @Override
    public Set<String> leave( final CollaborationParams params )
    {
        final long now = System.currentTimeMillis();
        final String collaboratorKey = collaboratorKey( params );
        final String contentId = params.getContentId();

        return contents.modify( contentId, collaborators -> {
            if ( collaborators == null )
            {
                return null;
            }
            else
            {
                collaborators = new LinkedHashSet<>( collaborators );
            }
            final boolean removedExpired = removeExpired( collaborators, now );

            final boolean removedExisting = removeByKey( collaborators, collaboratorKey );

            if ( removedExisting || removedExpired )
            {
                publishEvent( contentId, collaborators );
            }
            return collaborators.isEmpty() ? null : collaborators;
        }, CONTENT_COLLABORATORS_TTL );
    }

    private boolean removeByKey( final Set<String> collaborators, final String key )
    {
        return collaborators.removeIf( collaborator -> collaborator.startsWith( key ) );
    }

    private boolean removeExpired( final Set<String> collaborators, final long now )
    {
        return collaborators.removeIf( collaborator -> {
            long lastJoin = extractLastJoin( collaborator );
            return now - lastJoin > 2 * 60 * 1000;
        } );
    }

    private void publishEvent( final String contentId, final Set<String> collaborators )
    {
        eventPublisher.publish( Event.create( "edit.content.collaborators.update" )
                                    .distributed( true )
                                    .value( "contentId", contentId )
                                    .value( "collaborators",
                                            collaborators.stream().map( this::extractUserKey ).collect( Collectors.toSet() ) )
                                    .build() );
    }

    private String extractUserKey( final String collaboratorId )
    {
        return collaboratorId.split( "=", -1 )[1];
    }

    private long extractLastJoin( final String collaboratorId )
    {
        String[] idParts = collaboratorId.split( "=", -1 );
        return Long.parseLong( idParts[2] );
    }

    private static String collaboratorKey( final CollaborationParams params )
    {
        return params.getSessionId() + "=" + params.getUserKey();
    }
}
