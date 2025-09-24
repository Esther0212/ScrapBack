// context/userContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase"; // adjust path if needed

const UserContext = createContext({
    userData: null,
    setUserData: () => {}, // add setter
  });
  
  export const useUser = () => useContext(UserContext);
  
  export const UserProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const snap = await getDoc(doc(db, "user", user.uid));
            if (snap.exists()) {
              setUserData({ uid: user.uid, ...snap.data() });
            }
          } catch (err) {
            console.error("Error fetching user profile:", err);
          }
        } else {
          setUserData(null);
        }
        setLoading(false);
      });
  
      return unsubscribe;
    }, []);
  
    if (loading) return null;
  
    return (
      <UserContext.Provider value={{ userData, setUserData }}>
        {children}
      </UserContext.Provider>
    );
  };
  