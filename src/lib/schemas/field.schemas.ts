import { z } from 'zod';
import { Language } from '$lib/components/schemas';

/**
 * Field type enumeration for template fields
 */
export const FieldType = z.enum(['TEXT', 'IMAGE', 'AUDIO']);
export type FieldType = z.infer<typeof FieldType>;

/**
 * Field schema for template field validation
 */
export const fieldSchema = z.object({
	id: z.string().optional(), // Optional for new fields
	template: z.string().min(1, 'Template ID is required'),
	type: FieldType,
	isInput: z.boolean({
		required_error: 'Please specify if this is an input or generated field'
	}),
	language: z.nativeEnum(Language, {
		errorMap: () => ({ message: 'Please select a valid language' })
	}),
	label: z
		.string()
		.trim()
		.min(1, 'Field label is required')
		.max(50, 'Field label must be less than 50 characters')
		.regex(
			/^[a-zA-Z0-9\s\-_]+$/,
			'Field label can only contain letters, numbers, spaces, hyphens, and underscores'
		),
	description: z
		.string()
		.trim()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	example: z.string().trim().max(200, 'Example must be less than 200 characters').optional()
});

/**
 * Field form data schema for creating/editing fields
 */
export const fieldFormSchema = fieldSchema.omit({ id: true });

/**
 * Schema for validating a complete field list for a template
 */
export const fieldsListSchema = z
	.array(fieldSchema)
	.refine(
		(fields) => {
			// At least one input field is required
			const inputFields = fields.filter((field) => field.isInput);
			return inputFields.length > 0;
		},
		{
			message: 'At least one input field is required',
			path: []
		}
	)
	.refine(
		(fields) => {
			// Check for unique labels within the same template
			const labels = fields.map((field) => field.label.toLowerCase());
			const uniqueLabels = new Set(labels);
			return labels.length === uniqueLabels.size;
		},
		{
			message: 'Field labels must be unique within the template',
			path: []
		}
	)
	.refine(
		(fields) => {
			// Maximum 20 fields per template
			return fields.length <= 20;
		},
		{
			message: 'Templates cannot have more than 20 fields',
			path: []
		}
	);

/**
 * Schema for field validation with template context
 */
export const fieldWithTemplateSchema = z
	.object({
		field: fieldSchema,
		existingFields: z.array(fieldSchema).default([])
	})
	.refine(
		(data) => {
			// Check for unique label against existing fields
			const existingLabels = data.existingFields
				.filter((f) => f.id !== data.field.id) // Exclude self when editing
				.map((f) => f.label.toLowerCase());
			return !existingLabels.includes(data.field.label.toLowerCase());
		},
		{
			message: 'A field with this label already exists',
			path: ['field', 'label']
		}
	);

/**
 * Type exports
 */
export type FieldFormData = z.infer<typeof fieldFormSchema>;
export type FieldData = z.infer<typeof fieldSchema>;
export type FieldsList = z.infer<typeof fieldsListSchema>;
