package com.enonic.xp.app.contentstudio.json.content.page.region;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import com.enonic.xp.app.contentstudio.rest.resource.content.ComponentDisplayNameResolver;
import com.enonic.xp.region.TextComponent;

@SuppressWarnings("UnusedDeclaration")
public class TextComponentJson
    extends ComponentJson<TextComponent>
{
    private final TextComponent text;

    public TextComponentJson( final TextComponent component, final ComponentDisplayNameResolver componentDisplayNameResolver )
    {
        super( component, componentDisplayNameResolver );
        this.text = component;
    }

    @JsonCreator
    public TextComponentJson( @JsonProperty("text") final String text, @Deprecated @JsonProperty("name") final String name )
    {
        super( TextComponent.create().
            text( text ).
            build(), null );

        this.text = getComponent();
    }

    public String getText()
    {
        return this.text.getText();
    }
}
