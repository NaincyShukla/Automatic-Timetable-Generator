import API from "./axios";

export const generateTimetable = async (semester) => {

    const res = await API.post("/timetable/generate", {
        semester
    });

    return res.data;
};

export const getTimetable = async () => {

    const res = await API.get("/timetable");

    return res.data;

};