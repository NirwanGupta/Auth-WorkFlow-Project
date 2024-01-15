require(`dotenv`).config();
require(`express-async-errors`);    //  to avoid unnecessary try catches

const express = require(`express`);
const app = express();

const morgan = require(`morgan`);
const cookieParser = require(`cookie-parser`);  //  this middleware puts the cookie in the req
const fileUpload = require('express-fileupload');

const xss = require(`xss-clean`);
const rateLimiter = require(`express-rate-limit`);
const cors = require(`cors`);
const helmet = require(`helmet`);
const mongoSanitize = require(`express-mongo-sanitize`);

const connectDB = require(`./db/connect`);
const authRouter = require(`./router/authRouter`);
const userRouter = require(`./router/userRoutes`);
const productRouter = require(`./router/productRoutes`);
const reviewRouter = require(`./router/reviewRoutes`);
const orderRouter = require(`./router/orderRouter`);

const errorHandlerMiddleware = require(`./middleware/error-handler`);
const notFoundMiddleware = require(`./middleware/not-found`);

app.use(
    rateLimiter({
        windowMs: 1000*60*15,
        max: 60,
    })
);

app.use(cors());
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// app.use(morgan(`tiny`));    //  useful to know at any call that which route we are heading
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));

app.use(express.static(`./public`));
app.use(fileUpload());

app.use(`/api/v1/auth`, authRouter);
app.use('/api/v1/users', userRouter);
app.use(`/api/v1/products`, productRouter);
app.use(`/api/v1/reviews`, reviewRouter);
app.use(`/api/v1/orders`, orderRouter);

app.use(notFoundMiddleware);    //  if we try to access routes that are not covered we want 404, and once we reach 404, we want all functionality to stop, thus no next() in NotFoiund
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port, console.log(`Server is listening on port ${port}`));
    } catch (error) {
        console.log(error);
    }
}

start();