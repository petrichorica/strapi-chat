import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import socket from "socket.io-client";
import styles from '../styles/chat.module.css';

function ChatRoom({username, id}) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);

  const io = socket("http://localhost:1337");//Connecting to Socket.io backend
  let welcome;

  useEffect(() => {

    io.on("disconnect", () => {
      io.off();
      location.replace("http://localhost:3000/chat");
      console.log("disconnected");
    })

    io.emit("join", {username}, (error) => { //Sending the username to the backend as the user connects.
      if (error) return alert(error);
    });

    io.on("welcome", async (data, error) => {//Getting the welcome message from the backend
      let welcomeMessage = {
        user: data.user,
        message: data.text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      };
      welcome = welcomeMessage;
      setMessages([welcomeMessage]);//Storing the Welcome Message
      await fetch("http://localhost:1337/api/messages", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${window.sessionStorage.getItem('jwt')}`
        }
      })//Fetching all messages from Strapi
        .then(async (res) => {
          const response = await res.json();
          let arr = [welcomeMessage];
          response.data.map((one, i) => {
            arr = [...arr, one.attributes];
            setMessages(arr);// Storing all Messages in a state variable
          });
        })
        .catch((e) => console.log(e.message));
    });

    io.on("roomData", async (data) => {
      await fetch("http://localhost:1337/api/active-users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${window.sessionStorage.getItem('jwt')}`
        }
      }).then(async (res) => {
        const response = await res.json();
        let arr = [];
        response.data.map((item) => {
          arr = [...arr, {id: item.id, ...item.attributes}];
        })
        setUsers(arr);
      }).catch((e) => {
        console.log("get users error", e.message)
      })
    })

    io.on("message", async (data, error) => {//Listening for a message connection
      console.log("client listening for a message");
      await fetch("http://localhost:1337/api/messages")
        .then(async (res) => {
          const response = await res.json();
          let arr = [welcome];
          response.data.map((one, i) => {
            arr = [...arr, one.attributes];
          });
          setMessages(arr);
        })
        .catch((e) => console.log(e.message));
    });
  }, [username]);

  const sendMessage = (message) => {
    if (message) {
      io.emit("sendMessage", { message, user: username }, (error) => {// Sending the message to the backend
        if (error) {
          alert(error);
        }
      });
      setMessage("");
    } else {
      alert("Message can't be empty");
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleClick = () => {
    sendMessage(message);
  };

  return (
    <div className='flex h-full pt-12'>
      <div className='flex-none w-1/4 bg-gray-100 p-4'>
        <h2 className="font-bold text-lg mb-4">Users</h2>
        <ul className="list-disc pl-4">
          { (users?.length > 0) && users.map((userItem) => (
            <li
              key={userItem.socketid}
              className={`text-sm mb-2 ${
                userItem.active ? 'text-green-500' : 'text-gray-500'
              }`}
              >{userItem.user}</li>
          )) }
        </ul>
      </div>
      {/* right content */}
      <div className='flex-1 block mr-16 px-6 h-full'>
        {/* chat panel */}
        <div className='pb-20 h-full'>
          <div className={`overflow-y-auto h-full ${styles.scrollbar}`}>
            <div className='pr-4'>
            { messages.map((messageItem) => (
              <div key={messageItem.createdAt} className='flex flex-col'>
                <p className={`text-sm text-gray-500 ${
                    messageItem.user === username ? 'self-end' : 'self-start'
                  }`}
                >{messageItem.user}</p>
                <div
                  className={`mb-2 ${
                    messageItem.user === username ? 'self-end bg-blue-400' : 'self-start bg-gray-200'
                  } rounded-lg p-2`}
                  >
                  <p className="text-sm">{messageItem.message}</p>
                </div>
              </div>
            )) }
            </div>
          </div>
        </div>
        {/* input bar */}
        <div className="flex h-20 -mt-20 flex-row self-end items-center px-6">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-grow border rounded-lg p-2 mr-4"
            value={message}
            onChange={handleChange}
          />
          <button 
            onClick={handleClick}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Chat() {
  const router = useRouter();
  const [loginStatus, setLoginStatus] = useState(true);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(0);

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

    setUsername(user.username);
    setUserId(user.id);
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
    <div className='overflow-hidden p-6 h-screen'>
      <div className='-mb-10'>
        <h2 className='text-3xl px-4'>Start Chatting</h2>
      </div>
      <ChatRoom username={username} id={userId}/>
    </div>
  );
}