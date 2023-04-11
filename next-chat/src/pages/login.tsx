import { useState } from 'react';
import { useRouter } from 'next/router'
import style from '@/styles/login.module.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = async (e: any) => {
    e.preventDefault();
    const loginInfo = {
      identifier: email,
      password
    };
    const data = await fetch("http://localhost:1337/api/auth/local", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(loginInfo),
    });
    if (data.status === 200) {
      const {jwt, user} = await data.json();
      window.sessionStorage.setItem('jwt', jwt);
      window.sessionStorage.setItem('userData', JSON.stringify(user));
      router.push('/chat');
    } else {
      console.error("Fail to login!");
    }
  
    // const res = await fetch("http://localhost:1337/api/users/${user.id}?populate=*", {
    //   method: "GET",
    //   headers: {
    //     Authorization: `Bearer ${jwt}`,
    //   }
    // })
    // console.log(await res.json());
  }
  return (
    <div className={style["login-container"]}>
      <h2 className={style.h2}>Login</h2>
      <form className={style.form}>
        <label className={style.label} htmlFor="email">Email: </label>
        <input
          className={style.input}
          type="email"
          id="email"
          autoComplete='off'
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Getting the inputs
        />
        <label className={style.label} htmlFor="user">Password: </label>
        <input
          className={style.input}
          type="password"
          id="user"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // Getting the inputs
        />
        <button className={style.button} type="submit" onClick={login}>Login</button>
      </form>
    </div>
  );
}