import {EnonicAiSetupData} from '../saga/event/data/EnonicAiSetupData';

export interface AIAssistant {
    renderAiAssistant(container: HTMLElement, setupData: EnonicAiSetupData): void;
}
