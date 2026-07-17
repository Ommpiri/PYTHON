import { useState } from "react";
import type { QuizQuestion } from "@/lib/modules";
import { recordQuiz } from "@/lib/progress";

export function QuizBlock({
  slug,
  questions,
  isFlashback = false,
  onComplete,
}: {
  slug: string;
  questions: QuizQuestion[];
  isFlashback?: boolean;
  onComplete?: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const correctCount = Object.entries(answers).filter(
    ([i, a]) => questions[+i].answer === a,
  ).length;
  const percent = Math.round((correctCount / questions.length) * 100);

  const submit = () => {
    setSubmitted(true);
    if (!isFlashback) {
      recordQuiz(slug, percent);
    }
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="space-y-5">
      {questions.map((q, i) => (
        <div key={i}>
          <p className="font-mono text-xs text-warm-black/60 mb-1"># question {i + 1}</p>
          <p className="font-medium mb-2">{q.q}</p>
          <div className="grid gap-1.5">
            {q.choices.map((c, ci) => {
              const chosen = answers[i] === ci;
              const isCorrect = q.answer === ci;
              const showResult = submitted;
              const cls = showResult
                ? isCorrect
                  ? "border-teal text-teal draw-underline"
                  : chosen
                    ? "border-coral text-coral draw-underline"
                    : "border-black/10"
                : chosen
                  ? "border-amber"
                  : "border-black/10 hover:border-amber/60";
              return (
                <button
                  key={ci}
                  disabled={submitted}
                  onClick={() => setAnswers((a) => ({ ...a, [i]: ci }))}
                  className={`text-left px-3 py-2 rounded border font-mono text-sm ${cls}`}
                >
                  <span className="text-warm-black/50 mr-2">{String.fromCharCode(97 + ci)})</span>
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between pt-2 border-t border-black/10">
        {!submitted ? (
          <button
            onClick={submit}
            disabled={Object.keys(answers).length < questions.length}
            className="font-mono text-xs px-4 py-2 rounded bg-amber text-primary-foreground font-semibold disabled:opacity-60"
          >
            submit_answers()
          </button>
        ) : (
          <div className="font-mono text-sm">
            score:{" "}
            <span
              className={
                percent === 100 ? "text-teal" : percent >= 60 ? "text-amber" : "text-coral"
              }
            >
              {percent}%
            </span>{" "}
            <span className="text-warm-black/50">
              ({correctCount}/{questions.length})
            </span>
          </div>
        )}
        {submitted && (
          <button
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
            className="font-mono text-xs text-warm-black/60 hover:text-amber"
          >
            retry
          </button>
        )}
      </div>
    </div>
  );
}
