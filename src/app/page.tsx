import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4">Welcome to My Next.js App</h1>
        <p className="text-lg sm:text-xl text-gray-600">
          This is a simple landing page built with Next.js and Tailwind CSS.
        </p>
        <Button className="mt-8" variant="destructive">Get Started</Button>
      </div>
    </div>
  );
}
