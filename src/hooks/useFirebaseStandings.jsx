import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase.jsx";

const useFirebaseStandings = (season) => {
  const { data, isPending, isError, isSuccess, isPlaceholderData } = useQuery({
    queryKey: ["seasons", season],
    queryFn: async () => {
      const docRef = doc(db, "seasons", season);
      const response = await getDoc(docRef);
      return response.data();
    },
    placeholderData: (previousData) => previousData,
  });

  return {
    seasonData: data,
    isSuccess: isSuccess && !isPlaceholderData,
    isPending: isPending || isPlaceholderData,
    isError,
  };
};

export default useFirebaseStandings;
