import { initializeApp } from 'firebase/app';
import { getFirestore } from '@firebase/firestore';
const { initializeAppCheck, ReCaptchaV3Provider } = require("firebase/app-check");

const firebaseConfig = {
  apiKey: "AIzaSyDifgwhqmZNvyV4736aRB-XGzcVy4Upz8A",
  authDomain: "mlbstandings-383717.firebaseapp.com",
  projectId: "mlbstandings-383717",
  storageBucket: "mlbstandings-383717.appspot.com",
  messagingSenderId: "382941968137",
  appId: "1:382941968137:web:6db4c64944da411b8385d8",
  measurementId: "G-EZBTG17WZP"
};

const app = initializeApp(firebaseConfig);

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LeynwogAAAAAEIPbRX8SpW970Ostdkuf0FOtjPh'),
  isTokenAutoRefreshEnabled: true
});

export const db = getFirestore(app);