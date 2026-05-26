import { Router } from "express";
import { AuthRouters } from "../module/auth/auth.route.js";
import { UserRoutes } from "../module/user/user.route.js";
import { ReadingRoutes } from "../module/reading/reading.route.js";

const router=Router();

 router.use("/auth", AuthRouters);
 router.use("/users", UserRoutes); 
 router.use("/reading", ReadingRoutes);


export const IndexRoutes=router;