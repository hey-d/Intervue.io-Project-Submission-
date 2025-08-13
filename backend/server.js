// backend/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "https://live-poll-frontend-ycd5.onrender.com" } });

let polls = []; // all polls (active or ended)
const pollTimers = {}; // pollId -> timeout

function nowMs() { return Date.now(); }

function startPollTimer(poll) {
  // clear existing timer if any
  if (pollTimers[poll.id]) {
    clearTimeout(pollTimers[poll.id]);
  }
  const remainingMs = (poll.startedAt + poll.timeLimit * 1000) - nowMs();
  pollTimers[poll.id] = setTimeout(() => {
    // mark poll ended
    poll.active = false;
    io.emit("pollEnded", serializePollForClients(poll));
    // also broadcast final results
    io.emit("pollResultsUpdate", serializePollForClients(poll));
    delete pollTimers[poll.id];
  }, Math.max(0, remainingMs));
}

function serializePollForClients(poll) {
  // includes counts and voters keys minimally
  return {
    id: poll.id,
    question: poll.question,
    options: poll.options,
    counts: poll.counts,
    voters: poll.voters, // map name->index (useful for teacher)
    startedAt: poll.startedAt,
    timeLimit: poll.timeLimit,
    active: !!poll.active,
  };
}

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Teacher creates a poll
  socket.on("createPoll", ({ question, options, timeLimit }) => {
    if (!question || !Array.isArray(options) || options.length < 2) {
      return socket.emit("errorMsg", "Invalid poll payload");
    }
    const id = Date.now().toString();
    const poll = {
      id,
      question,
      options: options.slice(),
      counts: options.map(() => 0),
      voters: {}, // name -> index
      startedAt: nowMs(),
      timeLimit: Number(timeLimit) || 60,
      active: true
    };
    polls.push(poll);

    // notify everyone a poll started
    io.emit("pollStarted", serializePollForClients(poll));

    // schedule end
    startPollTimer(poll);

    console.log(`Poll created [${id}]:`, question, "timeLimit:", poll.timeLimit);
  });

  // Student registers and asks for poll lists
  socket.on("joinStudent", (studentName) => {
    socket.studentName = studentName;
    console.log(`Student joined: ${studentName} (${socket.id})`);
    // send poll list (active + participated info)
    sendPollListToStudent(socket, studentName);
  });

  // Student requests poll list explicitly
  socket.on("requestPollList", (studentName) => {
    sendPollListToStudent(socket, studentName);
  });

  function sendPollListToStudent(socket, studentName) {
    const available = polls
      .filter(p => p.active)
      .map(p => {
        const elapsed = Math.floor((nowMs() - p.startedAt) / 1000);
        const remaining = Math.max(0, p.timeLimit - elapsed);
        return { ...serializePollForClients(p), remainingTime: remaining };
      });

    const participated = polls
      .filter(p => p.voters && p.voters[studentName] !== undefined)
      .map(p => {
        const idx = p.voters[studentName];
        const answer = p.options[idx];
        return { id: p.id, question: p.question, answer, answeredIndex: idx, counts: p.counts };
      });

    socket.emit("pollListData", { available, participated });
  }

  // Student submits an answer
  // payload: { name, pollId, answerIndex } (answerIndex preferred)
  socket.on("submitAnswer", ({ name, pollId, answerIndex }) => {
    const poll = polls.find(p => p.id === String(pollId));
    if (!poll) {
      return socket.emit("errorMsg", "Poll not found");
    }
    if (!poll.active) {
      return socket.emit("errorMsg", "Poll already ended");
    }
    const idx = Number(answerIndex);
    if (Number.isNaN(idx) || idx < 0 || idx >= poll.options.length) {
      return socket.emit("errorMsg", "Invalid answer index");
    }

    // if already voted, remove previous count
    if (poll.voters[name] !== undefined) {
      const prev = poll.voters[name];
      poll.counts[prev] = Math.max(0, poll.counts[prev] - 1);
    }

    poll.voters[name] = idx;
    poll.counts[idx] = (poll.counts[idx] || 0) + 1;

    // Broadcast live results to teachers & students
    io.emit("pollResultsUpdate", serializePollForClients(poll));
    // Also update poll list for this student (so they see it in participated)
    sendPollListToStudent(socket, name);

    console.log(`Vote recorded for poll ${poll.id}: ${name} -> option ${idx} (${poll.options[idx]})`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
