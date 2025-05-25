---
layout: default
title: Home
---

# BlendSphere Documentation

Welcome to the technical documentation for BlendSphere, an innovative language learning application designed to support both group learning in language schools and individual learning. This documentation covers the architecture, data structures, and workflows of the application.

<div align="center">
  <img src="images/Frontend%20Architecture.png" alt="BlendSphere Architecture" width="80%" />
</div>

## 🚀 Getting Started

- [Installation Guide](#installation)
- [Quick Start Tutorial](#quick-start)
- [Demo Environment](https://blendsphere.example.com)

## 📘 About BlendSphere

BlendSphere combines the power of spaced repetition learning with artificial intelligence to create an effective language learning experience. Key features include:

- **AI-Generated Flashcards**: Automatically create customized learning materials
- **Spaced Repetition System**: Optimize review timing for better retention
- **Collaborative Learning**: Share materials and progress within classes
- **Progress Tracking**: Visualize learning journey with detailed analytics

## 📚 Documentation Sections

<div class="documentation-grid">
  <div class="doc-card">
    <h3><a href="frontend-architecture">Frontend Architecture</a></h3>
    <p>The structure of the BlendSphere frontend application, built with Svelte 5, TypeScript, and modern web technologies.</p>
    <a href="frontend-architecture"><img src="images/Frontend%20Architecture.png" alt="Frontend Architecture" /></a>
  </div>

  <div class="doc-card">
    <h3><a href="data-structure">Data Structure</a></h3>
    <p>The organization of data within BlendSphere, including user data, flashcards, decks, templates, and more.</p>
    <a href="data-structure"><img src="images/BlendSphere%20Data%20Structure%20-%20PocketBase%20Compatible.png" alt="Data Structure" /></a>
  </div>

  <div class="doc-card">
    <h3><a href="user-journeys">User Journeys</a></h3>
    <p>Key user flows within the application, including teacher onboarding, student participation, and daily repetition.</p>
    <a href="user-journeys"><img src="images/Teacher%20Onboarding%20Journey.png" alt="User Journeys" /></a>
  </div>

  <div class="doc-card">
    <h3><a href="srs-algorithm">SRS Algorithm</a></h3>
    <p>Details of the Spaced Repetition System algorithm that powers the learning experience.</p>
    <a href="srs-algorithm"><img src="images/SRS%20Algorithm%20-%20Class%20Structure.png" alt="SRS Algorithm" /></a>
  </div>

  <div class="doc-card">
    <h3><a href="ai-integration">AI Integration</a></h3>
    <p>How BlendSphere integrates with AI services to generate flashcards and enhance learning.</p>
    <a href="ai-integration"><img src="images/AI%20Integration.png" alt="AI Integration" /></a>
  </div>

  <div class="doc-card">
    <h3><a href="flashcard-data-flow">Flashcard Data Flow</a></h3>
    <p>The flow of flashcard data through the application, from creation to review and analysis.</p>
    <a href="flashcard-data-flow"><img src="images/Flashcard%20Data%20Flow.png" alt="Flashcard Data Flow" /></a>
  </div>
  
  <div class="doc-card">
    <h3><a href="template-system-requirements">Template System</a></h3>
    <p>Comprehensive requirements and specifications for the flashcard template system with AI integration.</p>
    <a href="template-system-requirements">📋 Template Requirements</a>
  </div>
  
  <div class="doc-card">
    <h3><a href="template-system-behavior">Template Behavior</a></h3>
    <p>Detailed behavioral specification for template creation, editing, and usage workflows.</p>
    <a href="template-system-behavior">⚙️ Template Behavior</a>
  </div>
  
  <div class="doc-card">
    <h3><a href="template-system-user-stories">Template User Stories</a></h3>
    <p>User stories and acceptance criteria for all template system functionality.</p>
    <a href="template-system-user-stories">📖 User Stories</a>
  </div>
  
  <div class="doc-card">
    <h3><a href="srs-algorithm">SRS Algorithm Lifecycle</a></h3>
    <p>The lifecycle of flashcards through the Spaced Repetition System.</p>
    <a href="srs-algorithm"><img src="images/SRS%20Algorithm%20-%20Flashcard%20Lifecycle.png" alt="SRS Algorithm Lifecycle" /></a>
  </div>
  
  <div class="doc-card">
    <h3><a href="user-journeys">Daily Repetition Journey</a></h3>
    <p>The day-to-day experience of using BlendSphere's spaced repetition system.</p>
    <a href="user-journeys"><img src="images/Daily%20Repetition%20Journey.png" alt="Daily Repetition Journey" /></a>
  </div>
  
  <div class="doc-card">
    <h3><a href="user-journeys">Student Participation</a></h3>
    <p>How students participate in the learning process with BlendSphere.</p>
    <a href="user-journeys"><img src="images/Student%20Participation%20Journey.png" alt="Student Participation Journey" /></a>
  </div>
</div>

## 💻 Technical Stack

BlendSphere is built with a modern web technology stack:

- **Framework**: Svelte 5
- **Build Tool**: Vite
- **Language**: TypeScript
- **UI Library**: shadcn-svelte
- **State Management**: Svelte stores
- **Styling**: Tailwind CSS
- **API Communication**: Fetch API
- **Backend**: 
  - PocketBase for core application data
  - FastAPI for AI services

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/wojciechlas/blendsphere-frontend.git

# Navigate to the project directory
cd blendsphere-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🧩 Quick Start

1. **Create an account** or log in to the application
2. **Create a new deck** of flashcards or import an existing one
3. **Generate AI flashcards** using the AI integration features
4. **Study your flashcards** with the spaced repetition system
5. **Track your progress** using the analytics dashboard

## 🤝 Contributing

We welcome contributions to BlendSphere! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information.

## 📄 License

BlendSphere is licensed under the [License](https://github.com/wojciechlas/blob/main/LICENSE).

<style>
.documentation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.doc-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.doc-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.doc-card img {
  max-height: 200px;
  object-fit: contain;
}
</style>
