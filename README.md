# Anti-Gravity

**Anti-Gravity** is a modern, context-aware AI text humanization tool. It uses advanced LLM processing to transform robotic, AI-generated content into authentic, human-sounding text.

## 🚀 Project Overview

This project is a high-fidelity frontend prototype built with the latest React ecosystem technologies. It demonstrates a sophisticated user interface for controlling AI text generation parameters.

### ✨ Key Features

*   **Humanization Engine**: Transforms input text based on selected context parameters.
*   **Context Control**:
    *   **Tone**: Neutral, Polite, Empathetic, Assertive, Friendly, Formal.
    *   **Audience**: General Reader, Student, Professional, Expert.
    *   **Formality**: Low, Medium, High.
*   **Analysis Dashboard**: visually displays the detected intent and explains *why* changes were made (Explainability AI).
*   **Premium UX**:
    *   **Glassmorphism**: Translucent panels and modern blur effects.
    *   **Dynamic Background**: Animated ambient lighting that breathes with the application.
    *   **Responsive Design**: Fluid layout adapting to all screen sizes.

---

## 🛠️ Technology Stack

This project uses the latest stable and cutting-edge web technologies:

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Library**: [React 19](https://react.dev/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## 📂 Project Structure

```bash
src/
├── app/
│   ├── layout.tsx       # Root layout with global font/styles
│   ├── page.tsx         # Main application view (Home)
│   └── globals.css      # Global styles & Tailwind directives
├── components/
│   ├── ControlPanel.tsx # UI for selecting Tone/Audience/Formality
│   ├── InputSection.tsx # Text input area with character count
│   └── OutputDisplay.tsx# Result card with Analysis & Explainability
└── lib/
    └── antigravity.ts   # Core logic types and simulated AI processing
```

## 🚦 Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure API Key**
    *   Create a `.env.local` file in the root directory.
    *   Add your OpenAI API Key:
        ```bash
        OPENAI_API_KEY=sk-your_api_key_here
        ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Open Browser**
    Navigate to [http://localhost:3000](http://localhost:3000) (or the port shown in terminal).

---

## 🔮 Future Roadmap

*   **History**: Save past humanizations to local storage.
*   **History**: Save past humanizations to local storage.
*   **Export**: Download results as PDF/Docx.
