class Poll {
  constructor(question, options, teacherId, timeLimit = 60) {
    this.id = Date.now().toString();
    this.question = question;
    this.options = options;
    this.responses = {}; // { studentName: optionIndex }
    this.teacherId = teacherId;
    this.timeLimit = timeLimit;
    this.isActive = true;
  }
}

module.exports = Poll;
