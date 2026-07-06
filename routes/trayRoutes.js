const express = require("express");
const router = express.Router();
const trayController = require("../controller/trayController");

router.get("/form", trayController.renderForm);
router.post("/formValidated", trayController.calculate);
router.get("/", trayController.home);

// JSON API endpoints
router.get("/api/trays", trayController.listTraysJson);
router.post("/api/calculate", trayController.calculateJson);
router.get("/api/featured-rates", trayController.featuredRatesJson);

module.exports = router;
