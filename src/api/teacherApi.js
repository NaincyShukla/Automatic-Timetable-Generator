 import API from "./axios";

export const getTeachers = async () => {
    const res = await API.get("/teachers");
    return res.data;
};

export const addTeacher = async (teacher) => {
    const res = await API.post("/teachers", teacher);
    return res.data;
};

export const deleteTeacher = async (id) => {
    const res = await API.delete(`/teachers/${id}`);
    return res.data;
};