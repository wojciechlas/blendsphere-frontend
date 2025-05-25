# Template System Requirements

## 1. Overview

The Template System is a core component of BlendSphere that enables users to create structured flashcard templates with customizab#### 4.2.1 Template Browser
- **Language Filter**: Filter by language pair
- **Level Filter**: Filter by CEFR level
- **Starter Templates**: Toggle to show/hide starter templates
- **Search**: Text search in template names/descriptions
- **Template Cards**: Visual preview with key informationouts and AI-assisted content generation. Templates define both the visual appearance and data structure of flashcards.

## 2. Functional Requirements

### 2.1 Template Creation and Management

#### 2.1.1 Template Structure
- **Basic Information**
  - Name (required, max 100 characters)
  - Description (optional, max 500 characters, used as AI context)
  - Version (semantic versioning: 1.0.0)
  - Author (automatically set to current user)

#### 2.1.2 Language Configuration
- **Native Language** (required) - user's first language
- **Learning Language** (required) - language being learned
- **Language Level** (required) - CEFR levels A1-C2
- Support for language pairs: EN, ES, FR, DE, IT, PL

#### 2.1.3 Layout Definition
- **Front Layout** - HTML template with placeholders (e.g., `{{word}}`, `{{pronunciation}}`)
- **Back Layout** - HTML template with placeholders (e.g., `{{translation}}`, `{{example}}`)
- **Placeholder Syntax**: `{{fieldName}}` for field values
- **Rich Text Editor** with:
  - Basic formatting (bold, italic, underline)
  - Text alignment and lists
  - Placeholder insertion via UI
  - Preview mode to see rendered output

#### 2.1.4 Visual Styling
- **Theme Selection**: Default, Modern, Classic, Minimal
- **Color Customization**:
  - Primary color (brand/accent)
  - Secondary color (supporting elements)
  - Background color
  - Text color
  - Accent color (highlights)
- **Typography Settings**:
  - Font family (from predefined list)
  - Font size (adjustable scale)
  - Font weight (light, normal, medium, bold)
  - Line height
- **Spacing Controls**:
  - Padding (internal spacing)
  - Margin (external spacing)
  - Border radius (rounded corners)
- **Custom CSS** (optional, for advanced users)

### 2.2 Field Management

#### 2.2.1 Field Types
- **TEXT**: Plain text or formatted text content
- **IMAGE**: Image files (JPG, PNG, WebP)
- **AUDIO**: Audio files (MP3, WAV, OGG)

#### 2.2.2 Field Properties
- **Label** (required) - Display name shown to users
- **Type** (required) - TEXT, IMAGE, or AUDIO
- **Language** (required) - Field's content language
- **IsInput** (required) - true for user input, false for AI-generated
- **Description** (optional) - AI prompt context and user guidance
- **Example** (optional) - Sample value to guide users and show in preview

#### 2.2.3 Field Validation
- **Required Fields**: label, type, language, isInput must be specified
- **Global Validation**: All fields use consistent validation rules
  - Allowed file types (JPG, PNG, WebP)
  - Maximum file size (default 5MB)
- **Audio Fields**:
  - Allowed file types (MP3, WAV, OGG)
  - Maximum file size (default 10MB)

### 2.3 Starter Templates

#### 2.3.1 Predefined Starting Points
- **Basic Vocabulary Template**
  - Input: word (learning language)
  - Generated: translation (native language), example sentence
- **Advanced Vocabulary Template**
  - Input: word (learning language)
  - Generated: translation, definition, example sentence, pronunciation
- **Verb Conjugation Template**
  - Input: infinitive verb
  - Generated: conjugated forms, usage examples
- **Grammar Patterns Template**
  - Input: grammar rule/pattern
  - Generated: explanation, examples, exceptions
- **Conversation Practice Template**
  - Input: conversation topic
  - Generated: dialogue, key phrases, cultural notes

#### 2.3.2 Template Sharing and Discovery
- All templates are user-created with complete customization freedom
- Users can view and clone public templates created by other users
- Users can clone any public template to create their own versions
- Public templates serve as inspiration and starting points for new users
- Users have complete freedom to customize any template to fit their needs

### 2.4 AI Integration

#### 2.4.1 Content Generation Context
- **Template Description**: Used as overall context for AI
- **Field Descriptions**: Used as specific prompts for each field
- **Language Pair**: Influences AI model selection and generation
- **Language Level**: Adjusts complexity of generated content

#### 2.4.2 Generation Process
1. User provides input field values
2. System combines template + field descriptions as AI prompt
3. AI generates content for non-input fields
4. User can review and edit generated content
5. Flashcard is created with final content

## 3. Technical Requirements

### 3.1 Data Storage

#### 3.1.1 Template Entity
```typescript
interface Template {
  id: string;
    name: string;
  description?: string;
  version: string;
  author: string;
  nativeLanguage: Language;
  learningLanguage: Language;
  languageLevel: LanguageLevel;
  frontLayout: string;
  backLayout: string;
  styles: TemplateStyles;
  user: string;
  isPublic: boolean;
  created: string;
  updated: string;
}
```

#### 3.1.2 Field Entity
```typescript
interface Field {
  id: string;
  template: string;
  type: FieldType;
  isInput: boolean;
  language: Language;
  label: string;
  description?: string;
  example?: string;
  created: string;
  updated: string;
}
```

### 3.2 User Interface Components

#### 3.2.1 Template Editor
- **Template Information Panel**: Basic template settings
- **Field Management Panel**: Add, edit, reorder fields
- **Layout Editor**: Rich text editor for front/back layouts
- **Style Customizer**: Visual styling controls
- **Preview Panel**: Live preview of flashcard appearance

#### 3.2.2 Template Browser
- **Category Filter**: Filter by template category
- **Language Filter**: Filter by language pair
- **Level Filter**: Filter by CEFR level
- **Search**: Text search in template names/descriptions
- **Template Cards**: Visual preview with key information

### 3.3 Validation and Error Handling

#### 3.3.1 Template Validation
- Template name uniqueness per user
- Required fields validation
- Layout placeholder validation (ensure all placeholders have corresponding fields)
- Style format validation (CSS syntax, color values)

#### 3.3.2 Field Validation
- Duplicate field labels within template
- Field order consistency
- Validation rules format checking
- File type and size validation for media fields

### 3.4 Performance Requirements

#### 3.4.1 Response Times
- Template loading: < 500ms
- Field operations: < 200ms
- Preview generation: < 1s
- Style application: < 300ms

#### 3.4.2 Scalability
- Support up to 50 fields per template
- Handle 10,000+ templates per user
- Efficient template cloning and versioning

## 4. User Experience Requirements

### 4.1 Template Creation Workflow

1. **Choose Starting Point**
   - Create from scratch
   - Start with a starter template
   - Clone existing user template

2. **Basic Configuration**
   - Set template name and description
   - Select language pair and level

3. **Field Definition**
   - Add input fields (what users will provide)
   - Add output fields (what AI will generate)
   - Configure field properties and validation

4. **Layout Design**
   - Design front side layout with placeholders
   - Design back side layout with placeholders
   - Preview flashcard appearance

5. **Style Customization**
   - Select theme
   - Customize colors and typography
   - Add custom CSS if needed

6. **Testing and Validation**
   - Create sample flashcard
   - Test AI generation
   - Validate layout rendering

### 4.2 Usability Guidelines

#### 4.2.1 Ease of Use
- Drag-and-drop field reordering
- One-click placeholder insertion
- Real-time preview updates
- Intuitive visual style controls

#### 4.2.2 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast theme option

#### 4.2.3 Mobile Responsiveness
- Template editor works on tablets (768px+)
- Template browser works on all devices
- Touch-friendly interface elements

## 5. Integration Requirements

### 5.1 AI Service Integration
- FastAPI backend for AI generation
- Prompt template compilation
- Response validation and parsing
- Error handling for AI failures

### 5.2 Backend Integration
- PocketBase for template and field storage
- Real-time updates for collaborative editing
- Backup and versioning support
- Template sharing mechanisms

### 5.3 Frontend Integration
- Svelte 5 component architecture
- shadcn-svelte UI components
- Tailwind CSS for styling
- TypeScript for type safety

## 6. Future Enhancements

### 6.1 Phase 2 Features
- Visual drag-and-drop layout builder
- Advanced template sharing and collaboration
- Collaborative template editing
- Advanced AI prompt customization
- Template versioning and history

### 6.2 Phase 3 Features
- Template analytics and usage metrics
- A/B testing for template effectiveness
- Multi-language template support
- Integration with external content sources

## 7. Success Metrics

### 7.1 Adoption Metrics
- Number of templates created per user
- Template usage frequency
- Starter template modification rate
- User retention after template creation
- Custom template creation vs. starter template usage

### 7.2 Quality Metrics
- Template creation completion rate
- AI generation success rate
- User satisfaction scores
- Template sharing and reuse rates
