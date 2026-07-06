const request = require("express");
const db = require("../config/firebase");

function computeRates({ width, height, thickness, type }) {
  const h = parseFloat(height);
  const w = parseFloat(width);
  const t = parseFloat(thickness);

  let finalRate = 0,
    coverRate = 0;

  if (type === "Raceway") {
    const weight1 = ((w + h * 2 + 30) * 2500 * 0.008 * t) / 1000;
    const weight2 = ((w + 30) * 2500 * 0.008 * t) / 1000;
    const finalWeight = weight1 + weight2;
    const rate = (finalWeight * 82) / 2.5;
    finalRate = Math.ceil(rate + 18 + 0.1 * rate + 2);
  } else if (type === "Ladder") {
    const weight1 = ((h + 30) * 2500 * 0.008 * 2 * t) / 1000;
    const weight2 = (65 * w * 0.008 * 10 * t) / 1000;
    const finalWeight = weight1 + weight2;
    const finalWeight2 = finalWeight * 82;
    const rate = (finalWeight2 + 95) / 2.5;
    finalRate = Math.ceil(rate + 0.1 * rate + 2);
  } else if (type == "HOT DIP Galvanised Ladder Tray") {
    const weight1 = ((h + 30) * 2500 * 0.008 * 2 * t) / 1000;
    const weight2 = (65 * w * 0.008 * 10 * t) / 1000;
    const finalWeight = weight1 + weight2;
    const finalWeight2 = finalWeight * 135;
    const rate = (finalWeight2 + 95) / 2.5;
    finalRate = Math.ceil(rate + 0.12 * rate);
  } else if (type == "HOT DIP Galvanised Raceway Tray") {
     const weight1 = ((w + h * 2 + 30) * 2500 * 0.008 * t) / 1000;
    const weight2 = ((w + 30) * 2500 * 0.008 * t) / 1000;
    const finalWeight = weight1 + weight2;
    const rate = (finalWeight * 135) / 2.5;
    finalRate = Math.ceil(rate + 18 + 0.12 * rate);

  } else if (type == "HOT DIP Galvanised Cable Tray") {
const rate = (w + h * 2) * 2500 * 0.008 * t;
    const updatedRate = rate / 1000;
    const totalRate = updatedRate * 135;
    const totalRate2 = totalRate / 2.5;
    const totalRate3 = Math.ceil(totalRate2 + 24 + 0.12 * totalRate2);
    finalRate = Math.ceil(totalRate3);
    
    const w1 = ((w + 30) * 2500 * 0.008 * t) / 1000;
    const w2 = (w1 * 135) / 2.5 + 14;
    coverRate = Math.ceil(w2 + 0.12 * w2);    

  }

  else {
    const rate = (w + h * 2) * 2500 * 0.008 * t;
    const updatedRate = rate / 1000;
    const totalRate = updatedRate * 82;
    const totalRate2 = totalRate / 2.5;
    const totalRate3 = Math.ceil(totalRate2 + 14 + 0.1 * totalRate2);
    finalRate = Math.ceil(totalRate3 + 2);

    const w1 = ((w + 30) * 2500 * 0.008 * t) / 1000;
    const w2 = (w1 * 66) / 2.5 + 4;
    coverRate = Math.ceil(w2 + 0.1 * w2);
  }

  return { finalRate, coverRate };
}

exports.renderForm = (req, res) => {
  res.render("form", { pageTitle: "Cable Tray Form" });
};
exports.home = async (req, res) => {
  const traysSnapshot = await db.collection("trays").get();
  const cableTray = [];
  traysSnapshot.forEach((doc) => {
    cableTray.push({ id: doc.id, ...doc.data() });
  });
  res.render("home", { pageTitle: "home", cableTray });
};

exports.calculate = (req, res) => {
  const { width, thickness, height, type } = req.body;
  const { finalRate, coverRate } = computeRates({
    width,
    height,
    thickness,
    type,
  });

  const tray = {
    type,
    width: parseFloat(width),
    thickness: parseFloat(thickness),
    height: parseFloat(height),
    finalRate,
    coverRate,
  };

  db.collection("trays").add(tray);

  res.render("result", { tray, pageTitle: "Cable Tray Rates" });
};

exports.calculateJson = async (req, res) => {
  try {
    const { width, thickness, height, type, save = false } = req.body || {};
    if (width == null || height == null || thickness == null || !type) {
      return res
        .status(400)
        .json({ error: "width, height, thickness, and type are required" });
    }
    const { finalRate, coverRate } = computeRates({
      width,
      height,
      thickness,
      type,
    });
    const tray = {
      type,
      width: parseFloat(width),
      thickness: parseFloat(thickness),
      height: parseFloat(height),
      finalRate,
      coverRate,
    };
    if (save) {
      await db.collection("trays").add(tray);
    }
    res.json(tray);
  } catch (e) {
    res.status(500).json({ error: "Failed to calculate" });
  }
};

exports.listTraysJson = async (req, res) => {
  try {
    const snapshot = await db.collection("trays").get();
    const trays = [];
    snapshot.forEach((doc) => trays.push({ id: doc.id, ...doc.data() }));
    res.json({ trays });
  } catch (e) {
    res.status(500).json({ error: "Failed to load trays" });
  }
};

exports.featuredRatesJson = async (req, res) => {
  try {
    const { width = 150, height = 50, thickness = 1.2 } = req.query;
    const types = [
      { id: 0, title: "Cable Tray", type: "Cable Tray" },
      { id: 1, title: "Ladder Tray", type: "Ladder" },
      { id: 2, title: "Raceway Tray", type: "Raceway" },
    ];
    const items = types.map(({ id, title, type }) => {
      const { finalRate, coverRate } = computeRates({
        width,
        height,
        thickness,
        type,
      });
      return { id, title, type, price: finalRate, coverRate };
    });
    res.json({
      items,
      width: parseFloat(width),
      height: parseFloat(height),
      thickness: parseFloat(thickness),
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to compute featured rates" });
  }
};
