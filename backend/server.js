import express from "express";
import gmailRoutes from "./routes/gmailRoutes.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Prometheus AI Assistant Running");
});

app.use("/gmail", gmailRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Prometheus server running on port ${PORT}`);
});
