import API from "./axios";

export const getSettings = async (userId) => {

    const res = await API.get(`/settings?userId=${userId}`);

    return res.data;

};

export const updateSettings = async (settings) => {

    const res = await API.put("/settings", settings);

    return res.data;

}; 