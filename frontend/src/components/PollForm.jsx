import React, { useState } from 'react';
import socket from '../utils/socket'; // assumes you exported socket from utils/socket.js

export default function PollForm({ defaultTime = 60 }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [timeLimit, setTimeLimit] = useState(defaultTime);
  const [creating, setCreating] = useState(false);

  function setOpt(i, v){
    setOptions(prev => {
      const copy = [...prev];
      copy[i] = v;
      return copy;
    });
  }

  function addOption(){
    setOptions(prev => [...prev, '']);
  }

  function removeOption(idx){
    if(options.length <= 2) return;
    setOptions(prev => prev.filter((_,i)=>i!==idx));
  }

  async function handleSubmit(e){
    e?.preventDefault();
    if(!question.trim() || options.filter(o=>o.trim()).length < 2){
      alert('Add a question and at least 2 options');
      return;
    }
    const payload = {
      question: question.trim(),
      options: options.filter(o=>o.trim()),
      timeLimit: Number(timeLimit) || defaultTime
    };

    try {
      setCreating(true);
      // backend API or socket emit; prefer both for resilience
      socket.emit('create-question', payload, (res) => {
        // server callback
        if(res?.error) alert(res.error);
      });
      // also emit generic createPoll for other clients if needed
      socket.emit('createPoll', payload);
      // reset form
      setQuestion('');
      setOptions(['','']);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <div className="label">New Question</div>
          <div className="small">Create a live poll question for students</div>
        </div>
        <div className="small">Time (s)</div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <input
            className="input"
            placeholder="Type your question here — e.g. Which feature should we prioritise?"
            value={question}
            onChange={e=>setQuestion(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                className="input"
                placeholder={`Option ${idx+1}`}
                value={opt}
                onChange={e=>setOpt(idx, e.target.value)}
              />
              <button type="button" onClick={()=>removeOption(idx)} className="btn btn-ghost">Remove</button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          <button type="button" onClick={addOption} className="btn btn-ghost">+ Add option</button>

          <div style={{width:140}}>
            <input
              className="input"
              type="number"
              min="5"
              max="600"
              value={timeLimit}
              onChange={e=>setTimeLimit(e.target.value)}
            />
            <div className="small mt-1">Seconds</div>
          </div>

          <div className="ml-auto">
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? 'Starting…' : 'Start Poll'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
