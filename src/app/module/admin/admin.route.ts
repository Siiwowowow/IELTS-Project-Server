//src/app/module/admin/admin.route.ts
import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { AdminController } from "./admin.controller.js";
import { changeManagedUserStatusSchema, updateAdminZodSchema } from "./admin.validation.js";

const router = Router();

router.get("/management/overview", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), AdminController.getManagementOverview);
router.get("/management/users", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), AdminController.getManagedUsers);
router.patch("/management/users/:id/status", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), validateRequest(changeManagedUserStatusSchema), AdminController.updateManagedUserStatus);
router.delete("/management/users/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), AdminController.deleteManagedUser);

router.get("/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AdminController.getAllAdmins);
router.get("/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AdminController.getAdminById);
router.patch("/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateAdminZodSchema), AdminController.updateAdmin);
router.delete("/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    AdminController.deleteAdmin);
router.patch("/change-user-status", 
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
     AdminController.changeUserStatus);
router.patch("/change-user-role",
     checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
     AdminController.changeUserRole);
export const AdminRoutes = router;
