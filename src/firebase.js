import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 아까 복사한 내용을 여기에 덮어씌우세요!
// (아래는 예시입니다. 본인의 키로 바꿔야 작동합니다)
const firebaseConfig = {
  apiKey: "AIzaSyBYFxDtpbNRT5lrS7BGr4H9S4KHDDRVLkQ",
  authDomain: "github-morimenz-party.firebaseapp.com",
  projectId: "github-morimenz-party",
  storageBucket: "github-morimenz-party.firebasestorage.app",
  messagingSenderId: "215363285268",
  appId: "1:215363285268:web:4c19cbe541f0909132d201",
  measurementId: "G-QN1D8G903H"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);