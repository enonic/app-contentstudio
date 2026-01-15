package com.enonic.app.contentstudio.rest.resource.content.json;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.app.contentstudio.json.content.ContentWorkflowInfoJson;

public class UpdateWorkflowJson
{
    private final String contentId;

    private final ContentWorkflowInfoJson workflow;

    @JsonCreator
    public UpdateWorkflowJson( @JsonProperty("contentId") final String contentId,
                               @JsonProperty("workflow") final ContentWorkflowInfoJson workflow )
    {
        this.contentId = contentId;
        this.workflow = workflow;
    }

    public String getContentId()
    {
        return contentId;
    }

    public ContentWorkflowInfoJson getWorkflow()
    {
        return workflow;
    }
}

