import {BaseEditor, createEditor, CustomTypes, Descendant} from 'slate';
import {ReactEditor, withReact, Slate, Editable} from 'slate-react';
import {useMemo, useState} from 'react';
import * as React from "react";

type CustomElement = {type: 'paragraph'; children: CustomText[]};
type CustomText = {text: string; bold?: true};

declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor
        Element: CustomElement
        Text: CustomText
    }
}

export interface IReactDemoProps {
    value: string | undefined;
    callback: (value: string) => void;
}

export default class RichEditor
    extends React.Component<IReactDemoProps> {

    state: {
        value: Descendant[]
    }

    constructor(props) {
        super(props);
        this.state = {
            value: !!props.value ? JSON.parse(props.value) : [
                {
                    type: 'paragraph',
                    children: [{ text: 'A line of text in a paragraph.' }],
                },
            ]
        };
    }

    componentDidMount() {
        console.log('componentDidMount')
    }

    onChange(value: Descendant[]) {
        //this.setState({ value: value });
        if (this.props.callback) {
            this.props.callback(JSON.stringify(value));
        }
    }

    render() {
        console.log('Render of Rich Editor');
        const editor = withReact(createEditor());

        return (
            <Slate editor={editor} value={this.state.value} onChange={this.onChange.bind(this)}>
                <Editable />
            </Slate>
        );
    }
}
