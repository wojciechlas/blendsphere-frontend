import { z } from 'zod';
import { Language, LanguageLevel } from '$lib/components/schemas';

/**
 * Template styles schema
 */
export const templateStylesSchema = z.object({
	theme: z.enum(['default', 'modern', 'classic', 'minimal']),
	colors: z.object({
		primary: z.string().min(4, 'Primary color is required'),
		secondary: z.string().min(4, 'Secondary color is required'),
		background: z.string().min(4, 'Background color is required'),
		text: z.string().min(4, 'Text color is required'),
		accent: z.string().min(4, 'Accent color is required')
	}),
	typography: z.object({
		fontFamily: z.string().min(1, 'Font family is required'),
		fontSize: z.string().min(1, 'Font size is required'),
		fontWeight: z.string().min(1, 'Font weight is required'),
		lineHeight: z.string().min(1, 'Line height is required')
	}),
	spacing: z.object({
		padding: z.string().min(1, 'Padding is required'),
		margin: z.string().min(1, 'Margin is required'),
		borderRadius: z.string().min(1, 'Border radius is required')
	}),
	customCSS: z.string().optional()
});

/**
 * Template creation form schema
 */
export const templateFormSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, 'Template name is required')
			.max(100, 'Template name must be less than 100 characters'),
		description: z
			.string()
			.trim()
			.max(500, 'Description must be less than 500 characters')
			.optional(),
		nativeLanguage: z.nativeEnum(Language, {
			errorMap: () => ({ message: 'Please select a native language' })
		}),
		learningLanguage: z.nativeEnum(Language, {
			errorMap: () => ({ message: 'Please select a learning language' })
		}),
		languageLevel: z.nativeEnum(LanguageLevel, {
			errorMap: () => ({ message: 'Please select a language level' })
		}),
		frontLayout: z.string().trim().min(1, 'Front layout is required'),
		backLayout: z.string().trim().min(1, 'Back layout is required'),
		styles: templateStylesSchema,
		isPublic: z.boolean().default(false)
	})
	.refine((data) => data.nativeLanguage !== data.learningLanguage, {
		message: 'Native and learning languages must be different',
		path: ['learningLanguage']
	});

/**
 * Type exports
 */
export type TemplateFormData = z.infer<typeof templateFormSchema>;
export type TemplateStyles = z.infer<typeof templateStylesSchema>;
