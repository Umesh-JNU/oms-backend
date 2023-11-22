const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error");
const dotenv = require("dotenv");
const app = express();

dotenv.config({ path: "./config/config.env" });

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
  })
);

app.get("/", (req, res, next) => res.json({ anc: "abc" }));

const adminRoute = require("./routes/adminRoute");
const userRoute = require("./routes/userRoute");
const categoryRoute = require("./routes/categoryRoute");
const productRoute = require("./routes/productRoute");
const cartRoute = require("./routes/cartRoute");
const orderRoute = require("./routes/orderRoute");
// const promotionRoute = require('./routes/promotionRoute');
// const quantityRoute = require('./routes/quantityRoute');
// const reviewRoute = require('./routes/reviewRoute');
// const faqRoute = require('./routes/faqRoute');
// const shippingRoute = require('./routes/shippingRoute');

app.use("/api/admin", adminRoute);
app.use("/api/user", userRoute);
app.use("/api/category", categoryRoute);
app.use("/api/product", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/order", orderRoute);
// app.use("/api/promotion", promotionRoute);
// app.use("/api/quantity", quantityRoute);
// app.use("/api/review", reviewRoute);
// app.use("/api/faq", faqRoute);
// app.use("/api/shipping", shippingRoute);

app.all('*', async (req, res) => {
  res.status(404).json({error:{message:"Not Found. Kindly Check the API path as well as request type"}})
});
app.use(errorMiddleware);

module.exports = app;
