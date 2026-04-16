import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 10000;

// servir archivos de React
app.use(express.static("dist"));

app.get("*", (req, res) => {
  res.sendFile(path.resolve("dist", "index.html"));
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});