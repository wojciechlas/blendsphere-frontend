import { Language, LanguageLevel } from '$lib/components/schemas';

/**
 * Template system constants
 */

export const SUPPORTED_LANGUAGES = [
    { value: Language.EN, label: 'English' },
    { value: Language.ES, label: 'Spanish' },
    { value: Language.FR, label: 'French' },
    { value: Language.DE, label: 'German' },
    { value: Language.IT, label: 'Italian' },
    { value: Language.PL, label: 'Polish' }
] as const;

export const LANGUAGE_LEVELS = [
    { value: LanguageLevel.A1, label: 'A1 - Beginner' },
    { value: LanguageLevel.A2, label: 'A2 - Elementary' },
    { value: LanguageLevel.B1, label: 'B1 - Intermediate' },
    { value: LanguageLevel.B2, label: 'B2 - Upper Intermediate' },
    { value: LanguageLevel.C1, label: 'C1 - Advanced' },
    { value: LanguageLevel.C2, label: 'C2 - Proficient' }
] as const;

export const TEMPLATE_THEMES = [
    { value: 'default', label: 'Default' },
    { value: 'modern', label: 'Modern' },
    { value: 'classic', label: 'Classic' },
    { value: 'minimal', label: 'Minimal' }
] as const;

export const FIELD_TYPES = [
    { value: 'TEXT', label: 'Text' },
    { value: 'IMAGE', label: 'Image' },
    { value: 'AUDIO', label: 'Audio' }
] as const;

export const DEFAULT_FRONT_LAYOUT = '';

export const DEFAULT_BACK_LAYOUT = '';

/**
 * Utility function to get language name from language code
 */
export function getLanguageName(languageCode: string): string {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.value === languageCode);
    return language?.label || languageCode;
}
