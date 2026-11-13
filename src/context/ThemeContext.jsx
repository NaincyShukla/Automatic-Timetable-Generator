import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {

    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {

        const savedTheme = localStorage.getItem("darkMode");

        if (savedTheme === "true") {

            setDarkMode(true);

            document.body.classList.add("dark");

        }

    }, []);

    useEffect(() => {

        if (darkMode) {

            document.body.classList.add("dark");

        } else {

            document.body.classList.remove("dark");

        }

        localStorage.setItem("darkMode", darkMode);

    }, [darkMode]);

    return (

        <ThemeContext.Provider
            value={{
                darkMode,
                setDarkMode,
            }}
        >

            {children}

        </ThemeContext.Provider>

    );

};

export const useTheme = () => useContext(ThemeContext);