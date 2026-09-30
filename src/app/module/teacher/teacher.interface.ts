// src/app/module/teacher/teacher.interface.ts

export interface ICreateTeacherPayload {
  name: string;
  email: string;
  password?: string;
  contactNumber?: string;
  designation?: string;
  bio?: string;
  expertise?: string;
  profilePhoto?: string;
}

export interface IUpdateTeacherPayload {
  teacher?: {
    name?: string;
    profilePhoto?: string;
    contactNumber?: string;
    designation?: string;
    bio?: string;
    expertise?: string;
  };
}

export interface IUpdateTeacherProfilePayload {
  name?: string;
  contactNumber?: string;
  designation?: string;
  bio?: string;
  expertise?: string;
  profilePhoto?: string;
}

export interface ITeacherFilterOptions {
  searchTerm?: string;
  isDeleted?: boolean;
}
