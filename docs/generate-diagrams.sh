#!/bin/bash

# Script to generate PNG images from all PlantUML diagrams

# Check if PlantUML jar exists, if not download it
PLANTUML_JAR="plantuml.jar"
if [ ! -f "$PLANTUML_JAR" ]; then
  echo "Downloading PlantUML..."
  curl -L "https://github.com/plantuml/plantuml/releases/download/v1.2025.2/plantuml-1.2025.2.jar" -o "$PLANTUML_JAR"
fi

# Create images directory if it doesn't exist
mkdir -p images

# Generate diagrams for all .puml files in the diagrams directory
for file in diagrams/*.puml; do
  echo "Generating diagram from $file..."
  java -jar "$PLANTUML_JAR" "$file" -o images
done

# Clean up old SRS Algorithm files that are no longer needed
if [ -f "images/SRS Algorithm.png" ]; then
  echo "Removing deprecated SRS Algorithm diagram..."
  rm "images/SRS Algorithm.png"
fi

echo "All diagrams generated in the images directory."
