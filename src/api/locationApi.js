import API from "./axios";

export const getLocations = async () => {
    const res = await API.get("/locations");
    return res.data;
};

export const addLocation = async (location) => {
    const res = await API.post("/locations", location);
    return res.data;
};

export const deleteLocation = async (id) => {
    const res = await API.delete(`/locations/${id}`);
    return res.data;
};