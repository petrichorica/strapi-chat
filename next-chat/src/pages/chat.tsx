import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/Home.module.css';

export default function Chat() {
  const router = useRouter();
  const [loginStatus, setLoginStatus] = useState(true);
  const getData = async function() {
    const userData = window.sessionStorage.getItem('userData');
    if (!userData) {
      // router.push('/login');
      setLoginStatus(false);
      return;
    }
    const user = JSON.parse(userData);
    if (!user.id) {
      // router.push('/login');
      setLoginStatus(false);
      return;
    }

    const res = await fetch(`http://localhost:1337/api/users/${user.id}`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    });
    if (res.status !== 200) {
      setLoginStatus(false);
      // router.push('/login');
    }
  }
  
  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (!loginStatus) {
      alert("Please login");
      router.push('/login');
    }
  }, [loginStatus])

  return (
    <div className={styles.main}>
      <h1>Start Chatting</h1>
    </div>
  );
}