import { signOut } from "firebase/auth";
import { auth } from "../../infra/services/firebaseConfig";

export const logoutController = async () => {
  try {
    await signOut(auth);
    console.log("Logout sucess!");
  } catch (error) {
    console.log(error);
    throw new Error("Error" + Error);
  }
};
