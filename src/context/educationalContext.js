import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase"; // adjust path if needed

const EducationalContext = createContext({
  educationalContent: [],
  setEducationalContent: () => {},
});

export const useEducational = () => useContext(EducationalContext);

export const EducationalProvider = ({ children }) => {
  const [educationalContent, setEducationalContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEducationalContent = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "educationalContent"));
        const content = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEducationalContent(content);
      } catch (err) {
        console.error("Error fetching educational content:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEducationalContent();
  }, []);

  if (loading) return null; // optional: you can show a splash screen here

  return (
    <EducationalContext.Provider value={{ educationalContent, setEducationalContent }}>
      {children}
    </EducationalContext.Provider>
  );
};
