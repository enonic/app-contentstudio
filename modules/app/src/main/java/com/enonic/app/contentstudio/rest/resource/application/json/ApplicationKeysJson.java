package com.enonic.app.contentstudio.rest.resource.application.json;

import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationKeys;

public class ApplicationKeysJson
{
    private final ApplicationKeys applicationKeys;

    @JsonCreator
    public ApplicationKeysJson( @JsonProperty("applicationKeys") final List<String> applicationKeys )
    {
        this.applicationKeys = ApplicationKeys.from( applicationKeys.stream().map( ApplicationKey::from ).collect( Collectors.toList() ) );
    }

    @JsonIgnore
    public ApplicationKeys getApplicationKeys()
    {
        return applicationKeys;
    }
}
