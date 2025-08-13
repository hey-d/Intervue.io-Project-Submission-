// client/src/pages/TeacherPage.jsx
import React, { useEffect, useState } from "react";
import socket from "../utils/socket";

export default function TeacherPage() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [timeLimit, setTimeLimit] = useState(60);
  const [activePolls, setActivePolls] = useState([]);

  useEffect(() => {
    socket.on("pollStarted", (poll) => {
      setActivePolls(prev => {
        const exists = prev.find(p => p.id === poll.id);
        if (exists) return prev.map(p => p.id === poll.id ? poll : p);
        return [...prev, poll];
      });
    });

    socket.on("pollResultsUpdate", (poll) => {
      setActivePolls(prev => prev.map(p => p.id === poll.id ? poll : p));
    });

    socket.on("pollEnded", (poll) => {
      setActivePolls(prev => prev.filter(p => p.id !== poll.id));
    });

    return () => {
      socket.off("pollStarted");
      socket.off("pollResultsUpdate");
      socket.off("pollEnded");
    };
  }, []);

  const createPoll = () => {
    const valid = options.filter(o => o.trim());
    if (!question.trim() || valid.length < 2) return alert("Provide a question and at least 2 options.");
    socket.emit("createPoll", { question, options: valid, timeLimit: Number(timeLimit) || 60 });
    setQuestion("");
    setOptions(["", ""]);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>

      <div className="card mb-6">
        <div className="mb-3">
          <input className="input w-full" placeholder="Question" value={question} onChange={e => setQuestion(e.target.value)} />
        </div>
        {options.map((opt, i) => (
          <div key={i} className="mb-2">
            <input className="input w-full" placeholder={`Option ${i+1}`} value={opt} onChange={e => {
              const copy = [...options]; copy[i] = e.target.value; setOptions(copy);
            }} />
          </div>
        ))}
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost" onClick={() => setOptions(prev => [...prev, ""])}>+ Add option</button>
          <input className="input" style={{ width: 120 }} type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} />
          <span className="small">seconds</span>
          <div className="ml-auto">
            <button className="btn btn-primary" onClick={createPoll}>Start Poll</button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Live Polls</h2>
        {activePolls.length === 0 && <div className="card">No live polls</div>}
        {activePolls.map(p => {
          const total = p.counts ? p.counts.reduce((a,b)=>a+b,0) : 0;
          return (
            <div key={p.id} className="card mb-4">
              <div className="font-semibold">{p.question}</div>
              <div className="small">Participants: {total}</div>
              <div className="mt-2 space-y-2">
                {p.options.map((opt, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>{opt}</div>
                    <div className="font-semibold">{(p.counts && p.counts[idx]) ? p.counts[idx] : 0}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
