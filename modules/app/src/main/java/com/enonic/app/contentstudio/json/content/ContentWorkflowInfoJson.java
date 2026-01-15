package com.enonic.app.contentstudio.json.content;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.content.WorkflowCheckState;
import com.enonic.xp.content.WorkflowInfo;
import com.enonic.xp.content.WorkflowState;

public class ContentWorkflowInfoJson
{
    private final WorkflowState state;

    @JsonCreator
    public ContentWorkflowInfoJson( @JsonProperty("state") WorkflowState state,
                                    @JsonProperty("checks") Map<String, WorkflowCheckState> checks )
    {
        this.state = state;
    }

    public ContentWorkflowInfoJson( final WorkflowInfo workflowInfo )
    {
        this.state = workflowInfo.getState();
    }

    public WorkflowState getState()
    {
        return state;
    }

    @SuppressWarnings("unused")
   public Map<String, WorkflowCheckState> getChecks()
    {
        return Map.of();
    }

    @JsonIgnore
    public WorkflowInfo getWorkflowInfo()
    {
        return WorkflowInfo.create().
            state( state ).
            build();
    }
}
