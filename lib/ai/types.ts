export type ExtractedContent = {
    rawText: string;
    concepts: string[];
    subject?: string;
    gradeLevel?: number;
    topics: string[];
};

export type Scene = {
    order: number;
    narrative: string; // Turkish
    visualPrompt: string; // English
    educationalGoal: string;
};

export type Flashcard = {
    term: string;
    definition: string;
    example: string;
};

export type QuizQuestion = {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
};

export type GeneratedLesson = {
    scenes: Scene[];
    flashcards: Flashcard[];
    quiz: QuizQuestion[];
    summary: string;
};
