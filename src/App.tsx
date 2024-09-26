import { useEffect, useState } from "react";
// import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

import "./App.css";

function App() {
  const [stdin, setStdin] = useState([""]);
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
    try {
      await invoke('send_response', { 
        response: JSON.stringify({ name, message: "Response from Tauri app 1" }) 
      });
    } catch (error) {
      console.error('Failed to send response:', error);
    }
  }

  useEffect(() => {
    const unlisten = listen<object>('native-message', async (event) => {
      setStdin(stdin => [...stdin, JSON.stringify(event.payload)]);
      // Process the input here
      try {
        await invoke('send_response', { 
          response: JSON.stringify({ message: "Response from Tauri app 2" }) 
        });
      } catch (error) {
        console.error('Failed to send response:', error);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>
      <ul>
        {stdin.map((input, index) => (
          <li key={index}>{input}</li>
        ))}
      </ul>
      {/* <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div> */}

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <p>{greetMsg}</p>
    </div>
  );
}

export default App;
