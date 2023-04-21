import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import socket from "socket.io-client";
import * as ss from "../../public/socket.io-stream";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import styles from '../styles/chat.module.css';

function ChatRoom({username, id}) {
  const [io, setIo] = useState();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  // const [currentFile, setCurrentFile] = useState();
  const [headerText, setHeaderText] = useState("Chat Room");
  const [showEmojis, setShowEmojis] = useState(true);

  const inputRef = useRef(null);
  const messageEndRef = useRef(null);

  const welcome = useRef("");
  const typingTimer = useRef();
  const isTyping = useRef(false);
  const defaultHeader = useRef("Chat Room");

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const getMessages = async () => {
    fetch("http://localhost:1337/api/messages", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${window.sessionStorage.getItem('jwt')}`
      }
    })
    .then(async (res) => {
      const response = await res.json();
      let arr = [welcome.current];
      response.data.map((one, i) => {
        arr = [...arr, one.attributes];
      });

      for (const item of arr) {
        if (item.isFile) {
          await fetch("http://localhost:1337/api/upload-files?filters[name][$eq]="
            + item.message, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${window.sessionStorage.getItem('jwt')}`
              }
            })
          .then(async (file_res) => {
            const fileInfo = await file_res.json();
            item.fileSize = fileInfo.data[0].attributes.size;
            item.fileActualName = fileInfo.data[0].attributes.actualName;
          })
          .catch((e) => {
            console.log(e.message);
          })
        }
      }

      setMessages(arr);

      setTimeout(() => {
        scrollToBottom();
      }, 0);
    })
    .catch((e) => console.log(e.message));
  }

  useEffect(() => {
    setIo(socket("http://localhost:1337"));//Connecting to Socket.io backend
  }, []);
  // const io = socket("http://localhost:1337");//Connecting to Socket.io backend
  // const stream = ss.createStream();

  useEffect(() => {

    if (!io) {
      return;
    }

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
      welcome.current = welcomeMessage;
      getMessages();
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
        // console.log(arr);
        setUsers(arr);
      }).catch((e) => {
        console.log("get users error", e.message)
      })
    })

    io.on("message", (data, error) => {//Listening for a message connection
      console.log("client listening for a message");
      getMessages();
    });

    io.on("someoneIsTyping", (data) => {
      if (data.user != username) {
        setHeaderText(`${data.user} is typing ...`);
      }
    });

    io.on("someoneStopsTyping", () => {
      setHeaderText(defaultHeader.current);
    })
  }, [username]);

  const sendMessage = (message, isFile = false) => {
    if (message) {
      io.emit("sendMessage", { message, user: username, isFile }, (error) => {// Sending the message to the backend
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

  const handleTypeStatus = (e) => {
    if (!isTyping.current) {
      io.emit("typing", {user: username}, (res) => {
        if (res.status) {
          isTyping.current = true;
        }
      })
    }

    if (e.code === "Enter") {
      setMessage(e.target.value);
      setTimeout(() => {
        handleClick();
      }, 0);
    }
  }

  const stopTyping = () => {
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      io.emit("stopTyping", {user: username}, (res) => {
        console.log(res);
      })
    }, 3000);
  }

  const handleClick = () => {
    sendMessage(message);
  };

  const handleFileUpload = () => {
    inputRef.current?.click();
  }

  const convertSize2Str = (size) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1048576) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / 1048576).toFixed(1)} MB`;
    }
  }

  const sendFileInfo = (file) => {
    const strapiData = {
      data: {
        name: file.name,
        size: file.size,
        actualName: file.actualName
      }
    };
    fetch("http://localhost:1337/api/upload-files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${window.sessionStorage.getItem('jwt')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(strapiData),
    })
    .then(async (res) => {
      const response = await res.json();
      console.log(response);
    })
    .catch((e) => {
      console.log(e.message);
    })
  }

  const downloadFileFromBlob = (data, fileName) => {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = "display: none";
    const blob = new Blob(data, {
      type : "octet/stream"
    });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const handleDownload = (fileName) => {
    console.log("download", fileName);
    const stream = ss.createStream();
    const fileBuffer = [];
    let fileLength = 0;

    ss(io).emit("fileDownload", stream, fileName, (err, info) => {
      if (err) {
        console.log(info);
      } else {
        stream.on('data', (chunk) => {
          fileLength += chunk.length;
          fileBuffer.push(chunk);
        });

        stream.on('end', () => {
          const filedata = new Uint8Array(fileLength);
          let i = 0;
          fileBuffer.forEach((buff) => {
            for (let j = 0; j < buff.length; j++) {
              filedata[i] = buff[j];
              i++;
            }
          });
          //== Download file in browser
          downloadFileFromBlob([filedata], fileName);
        });
      }
    })
  }

  const handleFileChange = (e) => {
    if (!e.target.files) {
      return;
    }
    console.log(e.target.files);

    const file = e.target.files[0];
    // setCurrentFile({
    //   fileName: file.name,
    //   fileSize: convertSize2Str(file.size),
    //   percentage: 0,
    // });

    const stream = ss.createStream();
    ss(io).emit("sendFile", stream, {name: file.name, size: file.size}, (res) => {
      file.actualName = res.actualName;
      console.log(file.actualName);
    });
    const readStream = ss.createBlobReadStream(file);

    setHeaderText("Uploading files ... ");

    // let size = 0;
    // readStream.on('data', (chunk) => {
    //   size += chunk.length;
    //   setCurrentFile((prev) => ({...prev, percentage: Math.floor(size / file.size * 100)}));
    //   // console.log(Math.floor(size / file.size * 100) + '%');
    // });

    readStream.on('end', () => {
      setHeaderText("Uploaded");
      setTimeout(() => {
        setHeaderText("");
      }, 3000);

      sendMessage(file.name, true);
      sendFileInfo(file);
    })

    readStream.pipe(stream);
    // ss.createBlobReadStream(file).pipe(stream);
    
  }

  const handleEmojiSelect = (value) => {
    setMessage(prev => prev + String.fromCodePoint('0x' + value.unified))
  }

  return (
    <div className='flex h-full pt-12'>
      <div className='flex-none w-1/4 bg-gray-100 p-4'>
        <h2 className="font-bold text-lg mb-4">Users</h2>
        <ul className="list-disc pl-4">
          { (users?.length > 0) && users.map((userItem) => (
            <li
              key={userItem.updatedAt}
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
        <div className='h-8 -mb-8 text-center'>{headerText}</div>
        <div className='pt-8 pb-20 h-full'>
          <div className={`overflow-y-auto h-full ${styles.scrollbar}`}>
            <div className='pr-4'>
            { messages.map((messageItem) => (
              <div key={messageItem.createdAt} className='flex flex-col'>
                <p className={`text-sm text-gray-500 ${
                    messageItem.user === username ? 'self-end' : 'self-start'
                  }`}
                >{messageItem.user}</p>
                {messageItem.isFile ? (
                  <div onClick={() => {handleDownload(messageItem.fileActualName)}} className={`mb-2 ${
                    messageItem.user === username ? 'self-end' : 'self-start'
                  } rounded-lg shadow bg-gray-50 p-2 flex flex-row items-center cursor-pointer`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div className='flex flex-col'>
                      <p className="text-sm">{messageItem.message}</p>
                      <p className="text-sm">{convertSize2Str(messageItem.fileSize)}</p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`mb-2 ${
                      messageItem.user === username ? 'self-end bg-blue-400' : 'self-start bg-gray-200'
                    } rounded-lg p-2`}
                    >
                    <p className="text-sm">{messageItem.message}</p>
                  </div>
                )}
              </div>
            )) }
              <div ref={messageEndRef}></div>
            </div>
          </div>
        </div>
        {/* input bar */}
        <div className="relative flex flex-col h-20 -mt-20 self-end px-6">
          {showEmojis > 0 && (<div className='absolute -top-80'>
            <Picker 
              data={data} 
              navPosition="bottom"
              emojiSize={20}
              emojiButtonSize={28}
              previewPosition="none"
              searchPosition="none"
              maxFrequentRows={0}
              onEmojiSelect={handleEmojiSelect} 
            />
          </div>)}
          <div className='flex flex-row py-2'>
            <div className='px-1 hover:cursor-pointer' onClick={() => {setShowEmojis(prev => !prev)}}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
            </div>
            <div className='px-1 hover:cursor-pointer' onClick={handleFileUpload}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
              <input
                type="file"
                ref={inputRef}
                onChange={handleFileChange}
                className='hidden'
              />
            </div>
          </div>
          <div className='flex flex-row'>
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-grow border rounded-lg p-2 mr-4"
              value={message}
              onChange={handleChange}
              onKeyDown={handleTypeStatus}
              onKeyUp={stopTyping}
            />
            <button 
              onClick={handleClick}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
              Send
            </button>
          </div>
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

    fetch(`http://localhost:1337/api/users/${user.id}`, {
      method: "GET",
      headers: {
        "Content-type": "application/json",
      },
    })
    .then((res) => {
      if (res.status !== 200) {
        setLoginStatus(false);
        // router.push('/login');
      }
    })
    .catch((err) => {
      console.log(err);
    })
    // if (res.status !== 200) {
    //   setLoginStatus(false);
    //   // router.push('/login');
    // }

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