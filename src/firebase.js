import { initializeApp } from 'firebase/app';
import { getFirestore } from '@firebase/firestore';
const { initializeAppCheck, ReCaptchaV3Provider } = require("firebase/app-check");

const firebaseConfig = {
  apiKey: "AIzaSyAQLSFe-lgeMRupJNWMLs3qAjVJdFqvL4k",
  authDomain: "mlbstandings-b51c6.firebaseapp.com",
  projectId: "mlbstandings-b51c6",
  storageBucket: "mlbstandings-b51c6.appspot.com",
  messagingSenderId: "316819942006",
  appId: "1:316819942006:web:6daca212a40f921f204d57",
  measurementId: "G-6Y93NMRHVD"
};

const app = initializeApp(firebaseConfig);

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LeynwogAAAAAEIPbRX8SpW970Ostdkuf0FOtjPh'),
  isTokenAutoRefreshEnabled: true
});

export const db = getFirestore(app);