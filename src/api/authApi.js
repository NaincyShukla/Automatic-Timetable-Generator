import API from "./axios";

export const changePassword = async (passwordData) => {

    const res = await API.put(
        "/auth/change-password",
        passwordData
    );

    

    return res.data;

};

export const deleteAccount = async (userId) => {
  const res = await API.delete(`/auth/delete/${userId}`);
  return res.data;
};