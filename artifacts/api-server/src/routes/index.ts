import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import signalsRouter from "./signals";
import tradesRouter from "./trades";
import topupsRouter from "./topups";
import adminRouter from "./admin";
import pocketOptionRouter from "./pocket-option";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(signalsRouter);
router.use(tradesRouter);
router.use(topupsRouter);
router.use(adminRouter);
router.use(pocketOptionRouter);

export default router;
