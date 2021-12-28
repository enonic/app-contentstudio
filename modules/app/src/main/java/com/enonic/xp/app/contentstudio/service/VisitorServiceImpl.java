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

import com.enonic.xp.app.contentstudio.json.VisitorJson;
import com.enonic.xp.app.contentstudio.json.VisitorParams;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.event.Event;
import com.enonic.xp.event.EventPublisher;

@Component(immediate = true)
public class VisitorServiceImpl
    implements VisitorService
{
    private EventPublisher eventPublisher;

    private final ConcurrentMap<ContentId, Set<VisitorJson>> contents = new ConcurrentHashMap<>();

    @Override
    public Set<VisitorJson> open( final VisitorParams params )
    {
        final ContentId contentId = ContentId.from( params.getContentId() );

        final VisitorJson visitor = new VisitorJson( params.getSessionId(), params.getUserKey() );

        final Set<VisitorJson> visitors = contents.computeIfAbsent( contentId, f -> new CopyOnWriteArraySet<>() );
        visitors.add( visitor );

        eventPublisher.publish( Event.create( "edit.content.new.visitor" ).
            distributed( true ).
            value( "contentId", contentId ).
            value( "newVisitor", visitorAsMap( visitor ) ).
            value( "visitors", visitors.stream().map( this::visitorAsMap ).collect( Collectors.toSet() ) ).
            build() );

        return visitors;
    }

    @Override
    public Set<VisitorJson> close( final VisitorParams params )
    {
        final ContentId contentId = ContentId.from( params.getContentId() );

        final Set<VisitorJson> visitors = contents.computeIfAbsent( contentId, f -> new CopyOnWriteArraySet<>() );

        final boolean removed = visitors.removeIf( visitor -> Objects.equals( visitor.getKey(), params.getUserKey() ) &&
            Objects.equals( visitor.getSessionId(), params.getSessionId() ) );

        if ( removed )
        {
            eventPublisher.publish( Event.create( "edit.content.remove.visitor" ).
                distributed( true ).
                value( "contentId", contentId ).
                value( "visitors", visitors.stream().map( this::visitorAsMap ).collect( Collectors.toSet() ) ).
                build() );
        }

        return visitors;
    }

    private Map<String, Object> visitorAsMap( final VisitorJson visitor )
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
