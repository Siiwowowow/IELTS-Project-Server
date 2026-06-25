import { Router } from "express";
import { AuthRouters } from "../module/auth/auth.route.js";
import { UserRoutes } from "../module/user/user.route.js";
import { ReadingRoutes } from "../module/reading/reading.route.js";
import { ListeningRoutes } from "../module/listening/listening.route.js";
import { WritingRoutes } from "../module/writing/writing.route.js";

const router=Router();

 router.use("/auth", AuthRouters);
 router.use("/users", UserRoutes); 
 router.use("/reading", ReadingRoutes);
 router.use("/listening", ListeningRoutes);
 router.use("/writing", WritingRoutes);

export const IndexRoutes=router;