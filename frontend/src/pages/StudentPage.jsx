// client/src/pages/StudentPage.jsx
import React, { useEffect, useState } from "react";
import socket from "../utils/socket";

export default function StudentPage() {
  const [nameInput, setNameInput] = useState("");
  const [registeredName, setRegisteredName] = useState("");
  const [availablePolls, setAvailablePolls] = useState([]); // active polls
  const [participatedPolls, setParticipatedPolls] = useState([]); // {id, question, answer, answeredIndex}
  const [now, setNow] = useState(Date.now());
  const [selectedAnswers, setSelectedAnswers] = useState({}); // pollId -> idx

  // ticking clock for timers (1s)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    socket.on("pollListData", ({ available, participated }) => {
      setAvailablePolls(available || []);
      setParticipatedPolls(participated || []);
    });

    socket.on("pollStarted", (poll) => {
      // add/update
      setAvailablePolls(prev => {
        const exists = prev.find(p => p.id === poll.id);
        if (exists) return prev.map(p => p.id === poll.id ? poll : p);
        return [...prev, poll];
      });
    });

    socket.on("pollResultsUpdate", (poll) => {
      // update counts in availablePolls or participated if present
      setAvailablePolls(prev => prev.map(p => p.id === poll.id ? poll : p));
      setParticipatedPolls(prev => prev.map(p => p.id === poll.id ? { ...p, counts: poll.counts } : p));
      // if this student answered this poll, move to participated
      if (registeredName && poll.voters && poll.voters[registeredName] !== undefined) {
        const idx = poll.voters[registeredName];
        const answer = poll.options[idx];
        setParticipatedPolls(prev => {
          if (prev.find(x => x.id === poll.id)) return prev.map(x => x.id === poll.id ? ({ id: poll.id, question: poll.question, answer, answeredIndex: idx, counts: poll.counts }) : x);
          return [...prev, { id: poll.id, question: poll.question, answer, answeredIndex: idx, counts: poll.counts }];
        });
        setAvailablePolls(prev => prev.filter(p => p.id !== poll.id));
      }
    });

    socket.on("pollEnded", (poll) => {
      // remove from available; ensure participated updated if student answered
      setAvailablePolls(prev => prev.filter(p => p.id !== poll.id));
      if (registeredName && poll.voters && poll.voters[registeredName] !== undefined) {
        const idx = poll.voters[registeredName];
        const answer = poll.options[idx];
        setParticipatedPolls(prev => {
          if (prev.find(x => x.id === poll.id)) return prev;
          return [...prev, { id: poll.id, question: poll.question, answer, answeredIndex: idx, counts: poll.counts }];
        });
      }
    });

    return () => {
      socket.off("pollListData");
      socket.off("pollStarted");
      socket.off("pollResultsUpdate");
      socket.off("pollEnded");
    };
  }, [registeredName]);

  const register = () => {
    const n = nameInput.trim();
    if (!n) return alert("Enter your name");
    setRegisteredName(n);
    socket.emit("joinStudent", n);
    socket.emit("requestPollList", n);
  };

  const submitAnswer = (pollId) => {
    const idx = selectedAnswers[pollId];
    if (idx === undefined) return alert("Select an option");
    socket.emit("submitAnswer", { name: registeredName, pollId, answerIndex: idx });
    // optimistic UI move to participated will be handled when 'pollResultsUpdate' arrives
  };

  if (!registeredName) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h2 className="text-2xl font-semibold mb-3">Enter your name to join</h2>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="input mb-3"
          placeholder="Your name"
        />
        <div>
          <button className="btn btn-primary" onClick={register}>Register</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Hello, {registeredName}</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Active Polls</h2>
        {availablePolls.length === 0 && <div className="card">No active polls right now.</div>}
        {availablePolls.map(p => {
          // compute remaining time from server's startedAt & timeLimit
          const elapsed = Math.floor((now - (p.startedAt || Date.now())) / 1000);
          const remaining = Math.max(0, (p.timeLimit || p.remainingTime || 60) - elapsed);
          return (
            <div key={p.id} className="card mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.question}</div>
                  <div className="small">Time left: {remaining}s</div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {p.options.map((opt, idx) => (
                  <label key={idx} className={`block w-full p-2 rounded ${selectedAnswers[p.id] === idx ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                    <input
                      type="radio"
                      name={`poll-${p.id}`}
                      checked={selectedAnswers[p.id] === idx}
                      onChange={() => setSelectedAnswers(prev => ({ ...prev, [p.id]: idx }))}
                      style={{ marginRight: 8 }}
                    />
                    {opt}
                    <span className="float-right small">{(p.counts && p.counts[idx]) ? `${p.counts[idx]} votes` : ''}</span>
                  </label>
                ))}
              </div>

              <div className="mt-3">
                <button className="btn btn-primary" onClick={() => submitAnswer(p.id)}>Submit Answer</button>
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Participated Polls</h3>
        <div className="flex flex-wrap gap-4">
            {participatedPolls.map((p, idx) => (
            <div
                key={idx}
                className="border p-4 rounded-lg bg-gray-100 min-w-[200px] flex-1"
            >
                <p className="font-semibold">{p.question}</p>
                <p className="text-sm text-gray-600">
                Your answer: <span className="font-medium">{p.answer}</span>
                </p>
            </div>
            ))}
        </div>
        </div>
      </section>
    </div>
  );
}
