# BlendSphere Data Structure Documentation

This directory contains PlantUML diagrams that document the data structures, interactions, and architecture of the BlendSphere application.

## Available Diagrams

1. **Data Structure (data-structure.puml)**
   - Contains the main entities and their relationships
   - Includes class diagrams for all data models used in the application
   - Defines enums for various type definitions
   - Output: `BlendSphere Data Structure - PocketBase Compatible.png`

2. **User Journeys (user-journeys.puml)**
   - Sequence diagrams for key user flows:
     - Teacher Onboarding
     - Student Participation
     - Daily Repetition
     - AI-Assisted Flashcard Creation
   - Output: Multiple journey-specific PNG files

3. **SRS Algorithm**
   - **Simple Overview (srs-algorithm-simple.puml)**
     - High-level overview of the SRS system
     - Output: `SRS Algorithm Simple.png`
   - **Class Structure (srs-algorithm-structure.puml)**
     - Details the data models used in the SRS algorithm
     - Output: `SRS Algorithm - Class Structure.png`
   - **Flashcard Lifecycle (srs-algorithm-state.puml)**
     - State diagrams for flashcard lifecycle
     - Documents algorithm parameters and calculations
     - Output: `SRS Algorithm - Flashcard Lifecycle.png`

4. **AI Integration**
   - **Complete Flow (ai-integration.puml)**
     - Components involved in AI integration
     - Data flow between frontend, backend, and AI service
     - Prompt templates and response processing
     - Output: `AI Integration.png`
   - **Simplified View (ai-integration-simple.puml)**
     - Streamlined version of the AI integration flow
     - Focused on key components and interactions

5. **Flashcard Data Flow (flashcard-data-flow.puml)**
   - Detailed data flow for flashcard creation and review
   - Request/response structures for flashcard operations
   - Synchronization process for offline support
   - Output: `Flashcard Data Flow.png`

6. **Frontend Architecture (frontend-architecture.puml)**
   - Overall architecture of the frontend application
   - Component relationships and dependencies
   - State management and data flow
   - Output: `Frontend Architecture.png`

## How to View the Diagrams

### HTML Viewer

The easiest way to view all diagrams is to use the included HTML viewer:

1. Generate the diagram images first (see below)
2. Open the `index.html` file in your web browser
3. This provides a nicely formatted view of all diagrams with navigation

### Online Viewer

1. Go to [PlantUML Online Editor](https://www.plantuml.com/plantuml/uml/)
2. Copy and paste the content of any .puml file
3. The diagram will render automatically

### VS Code Extension

1. Install the "PlantUML" extension in VS Code
2. Open any .puml file
3. Press Alt+D to preview the diagram

### Command Line

If you have PlantUML installed locally:

```bash
plantuml diagram.puml
```

This will generate a PNG file with the rendered diagram.

Alternatively, use the included script to generate all diagrams at once:

```bash
./generate-diagrams.sh
```

This will create PNG images for all diagrams in the `images/` directory.

## Updating the Diagrams

When making changes to the application's data structure or workflows:

1. Update the corresponding PlantUML diagram
2. Ensure the diagram accurately reflects the changes
3. Document any new entities, relationships, or flows
4. Keep the diagrams in sync with the actual implementation
5. Run `./generate-diagrams.sh` to update all diagram images

## Best Practices

- Use consistent naming across diagrams
- Maintain a clear separation of concerns
- Document relationships accurately
- Include notes for complex logic or algorithms
- Keep diagrams focused on specific aspects rather than trying to show everything in one diagram

## Reference

- [PlantUML Documentation](https://plantuml.com/guide)
- [PlantUML Class Diagram Guide](https://plantuml.com/class-diagram)
- [PlantUML Sequence Diagram Guide](https://plantuml.com/sequence-diagram)
