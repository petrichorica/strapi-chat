import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/login.module.css';

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handlesubmit = (e:any) => {
    e.preventDefault();
    const userData = {email, username, password};
    fetch("http://localhost:1337/api/auth/local/register", {
      method: 'POST',
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(userData),
    }).then(async (res) => {
      console.log(await res.json());
      router.push('/login');
    }).catch(err => {
      console.error("Error: ", err);
    })
  };
  return (
    <div className={styles["login-container"]}>
      <h2 className={styles.h2}>Sign Up</h2>
      <form className={styles.form}>
        <label className={styles.label} htmlFor="email">Email: </label>
        <input
          className={styles.input}
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Getting the inputs
        />
        <label className={styles.label} htmlFor="name">Username </label>
        <input
          className={styles.input}
          type="email"
          id="name"
          value={username}
          onChange={(e) => setUsername(e.target.value)} // Getting the inputs
        />
        <label className={styles.label} htmlFor="user">Password: </label>
        <input
          className={styles.input}
          type="password"
          id="user"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // Getting the inputs
        />
        <button className={styles.button} type="submit" onClick={handlesubmit}>Register</button>
      </form>
    </div>
  );
}
