/* eslint-disable @typescript-eslint/no-explicit-any */
//src/app/module/admin/admin.service.ts
import status from "http-status";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import { IUpdateAdminPayload, IChangeUserRolePayload, IChangeUserStatusPayload } from "./admin.interface.js";
import AppError from "../../errorHelpers/AppError.js";
import { Role, userStatus } from "@prisma/client";

const getAllAdmins = async () => {
    const admins = await prisma.admin.findMany({
        include: {
            user: true,
        }
    })
    return admins;
}

const getAdminById = async (id: string) => {
    const admin = await prisma.admin.findUnique({
        where: {
            id,
        },
        include: {
            user: true,
        }
    })
    return admin;
}

const updateAdmin = async (id: string, payload: IUpdateAdminPayload) => {
    //TODO: Validate who is updating the admin user. Only super admin can update admin user and only super admin can update super admin user but admin user cannot update super admin user

    const isAdminExist = await prisma.admin.findUnique({
        where: {
            id,
        }
    })

    if (!isAdminExist) {
        throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
    }

    const { admin } = payload;

    const updatedAdmin = await prisma.admin.update({
        where: {
            id,
        },
        data: {
            ...admin,
        }
    })

    return updatedAdmin;
}

//soft delete admin user by setting isDeleted to true and also delete the user session and account
const deleteAdmin = async (id: string, user: IRequestUser) => {
    //TODO: Validate who is deleting the admin user. Only super admin can delete admin user and only super admin can delete super admin user but admin user cannot delete super admin user

    const isAdminExist = await prisma.admin.findUnique({
        where: {
            id,
        }
    })

    if (!isAdminExist) {
        throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
    }

    if(isAdminExist.id === user.userId){
        throw new AppError(status.BAD_REQUEST, "You cannot delete yourself");
    }

    const result = await prisma.$transaction(async (tx: any) => {
        await tx.admin.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        })

        await tx.user.update({
            where: { id: isAdminExist.userId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                status: userStatus.DELETED
            },
        })

        await tx.session.deleteMany({
            where: { userId: isAdminExist.userId }
        })

        await tx.account.deleteMany({
            where: { userId: isAdminExist.userId }
        })

        const admin = await getAdminById(id);

        return admin;
    })

    return result;
}

const changeUserStatus = async (payload: IChangeUserStatusPayload, currentUser: IRequestUser) => {
    // TODO: Add authorization logic - only super admin can change user status
    // Check if current user is super admin
    
    const { userId, status: userStatus } = payload; // Renamed to avoid conflict with status import
    
    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    
    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }
    
    // Prevent self-status change if needed
    if (user.id === currentUser.userId) {
        throw new AppError(status.BAD_REQUEST, "You cannot change your own status");
    }
    
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            status: userStatus // Now using the correct field name
        }
    });
    
    return updatedUser;
}

const changeUserRole = async (payload: IChangeUserRolePayload, currentUser: IRequestUser) => {
    // TODO: Add authorization logic - only super admin can change user roles
    // Check if current user is super admin
    
    const { userId, role } = payload;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    
    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }
    
    // Prevent self-role change if needed
    if (user.id === currentUser.userId) {
        throw new AppError(status.BAD_REQUEST, "You cannot change your own role");
    }
    
    // Update user role
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            role: role
        }
    });

    if (role === Role.TEACHER) {
        await prisma.teacher.upsert({
            where: { userId: user.id },
            update: {
                isDeleted: false,
                deletedAt: null,
            },
            create: {
                userId: user.id,
                email: user.email,
                name: user.name || "Teacher",
                profilePhoto: user.image,
            },
        });
    } else if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
        await prisma.admin.upsert({
            where: { userId: user.id },
            update: {
                isDeleted: false,
                deletedAt: null,
            },
            create: {
                userId: user.id,
                email: user.email,
                name: user.name || "Admin",
                profilePhoto: user.image,
            },
        });
    }
    
    return updatedUser;
}

const getManagementOverview = async () => {
    const roles = { in: [Role.STUDENT, Role.TEACHER] };
    const [total, students, teachers, active, pending, blocked, deleted] = await prisma.$transaction([
        prisma.user.count({ where: { role: roles, isDeleted: false } }),
        prisma.user.count({ where: { role: Role.STUDENT, isDeleted: false } }),
        prisma.user.count({ where: { role: Role.TEACHER, isDeleted: false } }),
        prisma.user.count({ where: { role: roles, status: userStatus.ACTIVE, isDeleted: false } }),
        prisma.user.count({ where: { role: roles, status: userStatus.PENDING_VERIFICATION, isDeleted: false } }),
        prisma.user.count({ where: { role: roles, status: userStatus.BLOCKED, isDeleted: false } }),
        prisma.user.count({ where: { role: roles, OR: [{ isDeleted: true }, { status: userStatus.DELETED }] } }),
    ]);
    return { total, students, teachers, active, pending, blocked, deleted };
};

const getManagedUsers = async (query: { search?: string; role?: Role; status?: userStatus; includeDeleted?: boolean }) => prisma.user.findMany({
    where: {
        role: query.role ? query.role : { in: [Role.STUDENT, Role.TEACHER] },
        ...(query.status ? { status: query.status } : {}),
        ...(!query.includeDeleted ? { isDeleted: false } : {}),
        ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { email: { contains: query.search, mode: "insensitive" } }] } : {}),
    },
    select: { id: true, name: true, email: true, image: true, role: true, status: true, emailVerified: true, isPremium: true, isDeleted: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
});

const updateManagedUserStatus = async (userId: string, accountStatus: userStatus, currentUser: IRequestUser) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(status.NOT_FOUND, "User not found");
    if (user.id === currentUser.userId) throw new AppError(status.BAD_REQUEST, "You cannot change your own status");
    if (user.role === Role.SUPER_ADMIN) throw new AppError(status.FORBIDDEN, "Super admin status cannot be changed");
    return prisma.$transaction(async (tx: any) => {
        const updated = await tx.user.update({ where: { id: userId }, data: { status: accountStatus, isDeleted: accountStatus === userStatus.DELETED, deletedAt: accountStatus === userStatus.DELETED ? new Date() : null } });
        if (accountStatus === userStatus.BLOCKED || accountStatus === userStatus.DELETED) await tx.session.deleteMany({ where: { userId } });
        return updated;
    });
};

const deleteManagedUser = async (userId: string, currentUser: IRequestUser) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(status.NOT_FOUND, "User not found");
    if (user.id === currentUser.userId) throw new AppError(status.BAD_REQUEST, "You cannot delete your own account");
    if (user.role === Role.SUPER_ADMIN) throw new AppError(status.FORBIDDEN, "Super admin cannot be deleted");
    return prisma.$transaction(async (tx: any) => {
        await tx.session.deleteMany({ where: { userId } });
        await tx.account.deleteMany({ where: { userId } });
        if (user.role === Role.TEACHER) await tx.teacher.updateMany({ where: { userId }, data: { isDeleted: true, deletedAt: new Date() } });
        return tx.user.update({ where: { id: userId }, data: { status: userStatus.DELETED, isDeleted: true, deletedAt: new Date() } });
    });
};

export const AdminService = {
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    changeUserRole,
    changeUserStatus,
    getManagementOverview,
    getManagedUsers,
    updateManagedUserStatus,
    deleteManagedUser
}
