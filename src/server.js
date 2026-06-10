import dotenv from "dotenv";
dotenv.config();

const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AFTERGLOW API running on port ${PORT}`);
});