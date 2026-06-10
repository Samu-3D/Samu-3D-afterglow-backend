const authRoutes = require("./routes/auth");
app.use(express.json());
app.use("/api/auth", authRoutes);