package com.enonic.app.contentstudio.json.content;

import java.time.Instant;
import java.util.List;

import com.enonic.xp.content.ContentVersionId;

public record ActionJson(String operation, List<String> fields, String editorial, String user, String userDisplayName, Instant opTime)
{
}
