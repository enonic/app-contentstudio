package com.enonic.xp.app.contentstudio.rest.resource.content.page.layout;


import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.app.ApplicationKeys;

public class GetByApplicationsParams
{

    private final ApplicationKeys applicationKeys;

    @JsonCreator
    public GetByApplicationsParams( @JsonProperty("applicationKeys") List<String> applicationKeysAsStringList )
    {
        this.applicationKeys = ApplicationKeys.from( applicationKeysAsStringList.toArray( new String[0] ) );
    }

    @JsonIgnore
    public ApplicationKeys getApplicationKeys()
    {
        return applicationKeys;
    }
}
