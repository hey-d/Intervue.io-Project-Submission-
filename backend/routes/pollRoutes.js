const express = require("express");
const router = express.Router();
const pollController = require("../controllers/pollController");

router.post("/create", pollController.createPoll);
router.get("/active", pollController.getActivePoll);
router.post("/answer", pollController.submitAnswer);
router.get("/results", pollController.getResults);
router.post("/end", pollController.endPoll);

module.exports = router;
