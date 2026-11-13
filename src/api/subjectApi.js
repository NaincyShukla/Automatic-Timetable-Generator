import API from "./axios";

// Get all subjects
export const getSubjects = async () => {
    const res = await API.get("/subjects");
    return res.data;
};

// Add subject
export const addSubject = async (subject) => {
    const res = await API.post("/subjects", subject);
    return res.data;
};

// Update subject
export const updateSubject = async (id, subject) => {
    const res = await API.put(`/subjects/${id}`, subject);
    return res.data;
};

// Delete subject
export const deleteSubject = async (id) => {
    const res = await API.delete(`/subjects/${id}`);
    return res.data;
};

