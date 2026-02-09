package com.enonic.app.contentstudio.json.form;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonIgnore;

import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.form.Input;
import com.enonic.xp.inputtype.InputTypeName;
import com.enonic.xp.schema.LocalizedText;
import com.enonic.xp.util.GenericValue;

import static com.google.common.base.Strings.nullToEmpty;

public class InputJson
    extends FormItemJson<Input>
{
    private final Input input;

    private final OccurrencesJson occurrences;

    private final String inputType;

    private final LocaleMessageResolver localeMessageResolver;

    public InputJson( final Input input, final LocaleMessageResolver localeMessageResolver )
    {
        this.localeMessageResolver = localeMessageResolver;

        this.input = input;
        this.occurrences = new OccurrencesJson( input.getOccurrences() );
        this.inputType = input.getInputType().toString();
    }

    @JsonIgnore
    @Override
    public Input getFormItem()
    {
        return input;
    }

    @Override
    public String getName()
    {
        return input.getName();
    }

    public String getLabel()
    {
        if ( localeMessageResolver != null && !nullToEmpty( input.getLabelI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( input.getLabelI18nKey(), input.getLabel() );
        }
        else
        {
            return input.getLabel();
        }
    }

    public String getHelpText()
    {
        if ( localeMessageResolver != null && !nullToEmpty( input.getHelpTextI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( input.getHelpTextI18nKey(), input.getHelpText() );
        }
        else
        {
            return input.getHelpText();
        }
    }

    public OccurrencesJson getOccurrences()
    {
        return occurrences;
    }

    public String getInputType()
    {
        return this.inputType;
    }

    public Map<String, List<Map<String, Object>>> getConfig()
    {
        final GenericValue config = this.input.getInputTypeConfig();

        final Map<String, List<Map<String, Object>>> json = new LinkedHashMap<>();

        config.properties().forEach( configEntry -> {
            final String name = configEntry.getKey();
            final GenericValue value = configEntry.getValue();

            if ( "options".equals( configEntry.getKey() ) && ( InputTypeName.RADIO_BUTTON.equals( this.input.getInputType() ) ||
                InputTypeName.COMBO_BOX.equals( this.input.getInputType() ) ) )
            {
                json.put( name, doHandleRadioButtonOrComboBox( value ) );
            }
            else
            {
                json.put( name, toJsonAsList( value ) );
            }
        } );

        return json;
    }

    private List<Map<String, Object>> doHandleRadioButtonOrComboBox( final GenericValue value )
    {
        final List<Map<String, Object>> result = new ArrayList<>();

        value.values().forEach( item -> {
            final Map<String, Object> json = new LinkedHashMap<>();

            final String optionValue = item.optional( "value" ).map( GenericValue::asString ).orElse( null );

            json.put( "@value", optionValue );

            final Optional<GenericValue> label = item.optional( "label" );
            if ( label.isPresent() )
            {
                final LocalizedText localizedText = LocalizedText.from( label.get() );

                String labelText = localizedText.text();

                if ( localizedText.i18n() != null )
                {
                    final String i18nKey = localizedText.i18n();
                    json.put( "@i18n", i18nKey );

                    if ( InputTypeName.RADIO_BUTTON.equals( this.input.getInputType() ) )
                    {
                        labelText = this.localeMessageResolver.localizeMessage( i18nKey, labelText );
                    }
                }

                json.put( "value", labelText );
            }

            result.add( json );
        } );

        return result;
    }

    private List<Map<String, Object>> toJsonAsList( final GenericValue value )
    {
        return value.values().stream().map( property -> Map.of( "value", property.toRawJs() ) ).collect( Collectors.toList() );
    }
}
