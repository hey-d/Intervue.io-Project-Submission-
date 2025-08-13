const Poll = require("../models/Poll");

let activePoll = null;

exports.createPoll = (req, res) => {
  const { question, options, teacherId, timeLimit } = req.body;

  if (activePoll && activePoll.isActive) {
    return res.status(400).json({ message: "A poll is already active" });
  }

  activePoll = new Poll(question, options, teacherId, timeLimit);
  res.status(201).json(activePoll);
};

exports.getActivePoll = (req, res) => {
  if (!activePoll) {
    return res.status(404).json({ message: "No active poll" });
  }
  res.json(activePoll);
};

exports.submitAnswer = (req, res) => {
  const { studentName, answerIndex } = req.body;

  if (!activePoll || !activePoll.isActive) {
    return res.status(400).json({ message: "No active poll" });
  }

  activePoll.responses[studentName] = answerIndex;
  res.status(200).json({ message: "Answer submitted" });
};

exports.getResults = (req, res) => {
  if (!activePoll) {
    return res.status(404).json({ message: "No active poll" });
  }

  const results = activePoll.options.map((_, i) =>
    Object.values(activePoll.responses).filter(ans => ans === i).length
  );

  res.json({ question: activePoll.question, options: activePoll.options, results });
};

exports.endPoll = (req, res) => {
  if (activePoll) {
    activePoll.isActive = false;
  }
  res.json({ message: "Poll ended" });
};
