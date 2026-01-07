
import Link from 'next/link';
import { ArrowRight, BookOpen, Sparkles, Brain, Rocket } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-foreground">
      {/* Navbar */}
      <header className="px-6 lg:px-8 h-16 flex items-center justify-between border-b border-black/[0.05] dark:border-white/[0.1]">
        <Link className="flex items-center gap-2 font-display font-medium text-xl" href="/">
          <Rocket className="h-6 w-6 text-primary" />
          <span className="text-gray-900 dark:text-white font-bold">LalaKids</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-primary transition-colors" href="/login">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all hover:scale-105"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 dark:text-gray-300 ring-1 ring-gray-900/10 dark:ring-white/10 hover:ring-gray-900/20 dark:hover:ring-white/20">
                Play, Learn, Grow with AI.{" "}
                <Link href="/about" className="font-semibold text-primary">
                  Read more <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
            <h1 className="text-4xl font-display font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Learning Made <span className="text-primary">Magical</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Transform boring homework into interactive adventures. LalaKids uses AI to turn textbooks into games, helping your child learn faster and have fun.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all hover:scale-105"
              >
                Get started
              </Link>
              <Link href="/demo" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-1 group">
                Live demo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Superpowers for Learning</h2>
            <p className="mt-2 text-3xl font-display font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to master any subject
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Our AI engine adapts to your child's learning style, creating custom content that keeps them engaged.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-white/5 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <Sparkles className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <dt className="text-xl font-semibold leading-7 text-gray-900 dark:text-white font-display">
                  Interactive Stories
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">Turn any lesson into an immersive story where your child is the hero.</p>
                </dd>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-white/5 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <Brain className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <dt className="text-xl font-semibold leading-7 text-gray-900 dark:text-white font-display">
                  AI Tutor
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">A personal tutor that's always available to explain concepts and answer questions.</p>
                </dd>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-white/5 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <BookOpen className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <dt className="text-xl font-semibold leading-7 text-gray-900 dark:text-white font-display">
                  Homework Helper
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">Snap a photo of any textbook page and instantly generate quizzes and flashcards.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/[0.05] dark:border-white/[0.1] bg-white dark:bg-black/20">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
              &copy; 2024 Gala App Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
