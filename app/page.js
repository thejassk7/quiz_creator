"use client";

import { useEffect, useState } from "react";
import { get, push, ref, set } from "firebase/database";
import { database, firebaseIsConfigured } from "../lib/firebase";

const emptyForm = {
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
};

export default function Home() {
  const [form, setForm] = useState(emptyForm);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchQuestions() {
      if (!firebaseIsConfigured) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await get(ref(database, "questions"));
        const data = snapshot.val();
        const items = data
          ? Object.entries(data)
              .map(([id, question]) => ({ id, ...question }))
              .reverse()
          : [];
        setQuestions(items);
      } catch (error) {
        setMessage("Could not load saved questions. Check Firebase Rules and configuration.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveQuestion(event) {
    event.preventEvent?.();
    event.preventDefault();

    if (!firebaseIsConfigured) {
      setMessage("Add your Firebase project values to .env.local first.");
      return;
    }

    const cleaned = {
      question: form.question.trim(),
      optionA: form.optionA.trim(),
      optionB: form.optionB.trim(),
      optionC: form.optionC.trim(),
      optionD: form.optionD.trim(),
      correctAnswer: form.correctAnswer,
    };

    if (Object.values(cleaned).some((value) => !value)) {
      setMessage("Please complete every field before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const questionsRef = ref(database, "questions");
      const newQuestionRef = push(questionsRef);
      await set(newQuestionRef, cleaned);

      setQuestions((current) => [{ id: newQuestionRef.key, ...cleaned }, ...current]);
      setForm(emptyForm);
      setMessage("Question saved successfully.");
    } catch (error) {
      setMessage("Could not save the question. Check your Firebase settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">Q</div>
          <div>
            <span className="brand-name">QUIZ CREATOR</span>
            <span className="brand-subtitle">Question Library</span>
          </div>
        </div>
        <div className="question-count"><strong>{questions.length}</strong> saved</div>
      </header>

      <div className="content">
        <section className="panel form-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CREATE</span>
              <h1>Add a quiz question</h1>
            </div>
            <span className="step-badge">NEW</span>
          </div>

          <form onSubmit={saveQuestion}>
            <label className="field question-field">
              <span>Question</span>
              <textarea
                name="question"
                value={form.question}
                onChange={updateField}
                placeholder="Type your quiz question here..."
                rows={3}
              />
            </label>

            <div className="options-grid">
              {["A", "B", "C", "D"].map((letter) => (
                <label className="field" key={letter}>
                  <span>Option {letter}</span>
                  <input
                    name={`option${letter}`}
                    value={form[`option${letter}`]}
                    onChange={updateField}
                    placeholder={`Enter option ${letter}`}
                  />
                </label>
              ))}
            </div>

            <div className="form-footer">
              <label className="field answer-field">
                <span>Correct answer</span>
                <select name="correctAnswer" value={form.correctAnswer} onChange={updateField}>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </label>

              <button type="submit" className="save-button" disabled={saving}>
                <span>{saving ? "Saving..." : "Save question"}</span>
                <span className="button-arrow" aria-hidden="true">→</span>
              </button>
            </div>

            {message && <div className="status-message">{message}</div>}
          </form>
        </section>

        <section className="library">
          <div className="library-heading">
            <div>
              <span className="eyebrow">LIBRARY</span>
              <h2>Saved questions</h2>
            </div>
            <span className="library-line" />
          </div>

          {loading ? (
            <div className="empty-state">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">?</div>
              <h3>No questions yet</h3>
              <p>Your saved quiz questions will appear here.</p>
            </div>
          ) : (
            <div className="question-list">
              {questions.map((item, index) => (
                <article className="question-card" key={item.id}>
                  <div className="card-number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="card-content">
                    <h3>{item.question}</h3>
                    <div className="answer-options">
                      {["A", "B", "C", "D"].map((letter) => (
                        <div
                          className={`answer-option ${item.correctAnswer === letter ? "correct" : ""}`}
                          key={letter}
                        >
                          <span className="option-letter">{letter}</span>
                          <span>{item[`option${letter}`]}</span>
                          {item.correctAnswer === letter && <span className="correct-label">Correct</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
