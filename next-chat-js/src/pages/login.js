import { useState } from 'react';
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = async (e) => {
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
      // console.log("user", user);
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
    <div className="flex w-full min-h-full items-center justify-center -mt-10 p-12 sm:px-6 lg:px-8">
      <div className='flex flex-col w-2/5'>
      <h2 className='text-center text-3xl font-bold tracking-tight text-gray-900'>Login</h2>
        <form className='flex flex-col mt-8 p-6 space-y-4 rounded shadow-lg'>
          <label htmlFor="email" className='text-lg'>Email: </label>
          <input
            className='border-2 rounded-md text-base'
            type="email"
            id="email"
            autoComplete='off'
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Getting the inputs
          />
          <label htmlFor="user" className='text-lg'>Password: </label>
          <input
            className='border-2 rounded-md text-base'
            type="password"
            id="user"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // Getting the inputs
          />
          <button 
            type="submit" 
            onClick={login} 
            className='mt-4 p-2 bg-green-500 hover:bg-green-400 text-white rounded-md text-xl'>Login</button>
        </form>
        </div>
    </div>
  );
}