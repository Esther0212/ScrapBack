import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

const EducationalContext = createContext({
  educationalContent: [],
  setEducationalContent: () => {},
  selectedType: null,
  setSelectedType: () => {},
});

export const useEducational = () => useContext(EducationalContext);

export const EducationalProvider = ({ children }) => {
  const [educationalContent, setEducationalContent] = useState([]);
  const [selectedType, setSelectedType] = useState(null); // 🔹 global type
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEducationalContent = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "educationalContent")
        );

        const content = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            type: data.type || "",
            recyclingImage: data.recyclingImage || null,
            doImage: data.doImage || null,
            dontImage: data.dontImage || null,
            headings: (data.headings || []).map((h) => ({
              header: h?.header || "",
              subtitles: h?.subtitles || [],
              descriptions: (h?.descriptions || []).map((d) => {
                if (!d) return { descriptionTitle: "", description: "" };
                if (typeof d === "string") {
                  return { descriptionTitle: "", description: d };
                }
                return {
                  descriptionTitle: d.descriptionTitle || "",
                  description: d.description || "",
                };
              }),
              contents: (h?.contents || []).map((c) => ({
                contentTitle: c?.contentTitle || "",
                content: c?.content || "",
              })),
            })),
            dos: (data.dos || []).map((d) => ({
              doContent: d?.doContent || "",
            })),
            donts: (data.donts || []).map((d) => ({
              dontContent: d?.dontContent || "",
            })),
          };
        });

        setEducationalContent(content);
      } catch (err) {
        console.error("Error fetching educational content:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEducationalContent();
  }, []);

  if (loading) return null;

  return (
    <EducationalContext.Provider
      value={{
        educationalContent,
        setEducationalContent,
        selectedType,
        setSelectedType,
      }}
    >
      {children}
    </EducationalContext.Provider>
  );
};
