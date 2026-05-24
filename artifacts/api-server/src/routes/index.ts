import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import groupsRouter from "./groups";
import moviesRouter from "./movies";
import activityRouter from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(groupsRouter);
router.use(moviesRouter);
router.use(activityRouter);

export default router;
