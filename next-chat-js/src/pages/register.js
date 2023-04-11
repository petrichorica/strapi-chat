import { useState } from 'react';
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handlesubmit = (e) => {
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
    <div className="flex w-full min-h-full items-center justify-center -mt-10 p-12 sm:px-6 lg:px-8">
      <div className='flex flex-col w-2/5'>
      <h2 className='text-center text-3xl font-bold tracking-tight text-gray-900'>Sign up</h2>
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
          <label htmlFor="name" className='text-lg'>Username </label>
          <input
            className='border-2 rounded-md text-base'
            type="text"
            id="name"
            value={username}
            onChange={(e) => setUsername(e.target.value)} // Getting the inputs
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
            onClick={handlesubmit} 
            className='mt-4 p-2 bg-green-500 hover:bg-green-400 text-white rounded-md text-xl'>
              Register</button>
        </form>
        </div>
    </div>
  );
}