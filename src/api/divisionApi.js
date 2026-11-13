import API from "./axios";

export const getDivisions = async () => {
    const res = await API.get("/divisions");
    return res.data;
};

export const addDivision = async (division) => {
    const res = await API.post("/divisions", division);
    return res.data;
};

export const deleteDivision = async (id) => {
    const res = await API.delete(`/divisions/${id}`);
    return res.data;
};