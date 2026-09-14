import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generationRouter from "./generation";
import galleryRouter from "./gallery";
import historyRouter from "./history";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generationRouter);
router.use(galleryRouter);
router.use(historyRouter);

export default router;
