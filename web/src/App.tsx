import React, { useState } from "react";
import axios from "axios";
import { useAuthSession } from "./hooks/auth";
import { useIDEStatus } from "./hooks/ide";
import "./App.css";

function App() {
  const { profile, status, isLoading } = useAuthSession();
  const {
    ideRunning,
    isLoading: isIdeStatusLoading,
    hasTried,
  } = useIDEStatus({
    enabled: status === "authenticated",
  });

  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [code3, setCode3] = useState("");
  const [code4, setCode4] = useState("");
  const [code5, setCode5] = useState("");
  const [isEntered, setIsEntered] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failedCount, setFailedCount] = useState(0);
  const [ideLoading, setideLoading] = useState(false);

  const onEnter = () => {
    if (
      code1 === "2" &&
      code2 === "7" &&
      code3 === "1" &&
      code4 === "8" &&
      code5 === "2"
    ) {
      setIsEntered(true);
    } else {
      setFailed(true);
      setFailedCount(failedCount + 1);
      setCode1("");
      setCode2("");
      setCode3("");
      setCode4("");
      setCode5("");
    }
  };

  const launchIDE = () => {
    if (!ideRunning && !isIdeStatusLoading) {
      setideLoading(true);
      axios.get("/api/ide/create").then((res) => {
        if (res.data === "created" || res.data === "running") {
          setTimeout(() => {
            window.location.href = "http://ide.codelaunch.sh";
          }, 10000);
        } else if (res.data === "failed") {
          console.log("Failed to initialize IDE");
        }
      });
    } else {
      window.location.href = "http://ide.codelaunch.sh";
    }
  };

  const SingleCodeInput = ({ value, onChange }: any) => (
    <div className="w-16 h-16 ">
      <input
        className="w-full h-full flex flex-col items-center justify-center text-center px-5 outline-none rounded-xl border border-gray-900 text-lg bg-gray-900/50 focus:bg-gray-900 focus:ring-1 ring-green-400 text-white"
        type="text"
        maxLength={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  return (
    <div className="App">
      <div className="min-h-screen w-screen bg-black flex flex-col items-center justify-center space-y-3 font-mono">
        <div className="absolute flex bottom-10 space-x-3">
          <img src={"/assets/images/cl.png"} />
        </div>
        {!isLoading && status === "unauthenticated" && !isEntered && (
          <>
            <h1 className="text-xl text-white">Enter Passcode</h1>
            <div className="flex flex-row items-center justify-between mx-auto w-full w-[400px] space-x-4 pt-4">
              {[
                [code1, setCode1],
                [code2, setCode2],
                [code3, setCode3],
                [code4, setCode4],
                [code5, setCode5],
              ].map((item) => (
                <SingleCodeInput value={item[0]} onChange={item[1] as any} />
              ))}
            </div>
            {failed && (
              <p className="p-4 text-red-600">failed {failedCount} times</p>
            )}
            <button
              onClick={onEnter}
              className="text-white font-mono pt-3 hover:text-green-400 font-bold"
            >
              {"-> enter"}
            </button>
          </>
        )}
        {!isLoading && status === "unauthenticated" && isEntered && (
          <>
            <h1 className="pt-4 text-gray-300">
              Welcome Sign In With Github to Proceed...
            </h1>
            <a
              href="http://codelaunch.sh/api/auth/github?src=web"
              className="text-white font-mono pt-3 hover:text-green-400 font-bold"
            >
              {"-> sign in with github"}
            </a>
          </>
        )}
        {!isLoading && status === "authenticated" && (
          <>
            {!ideLoading ? (
              <button
                onClick={launchIDE}
                className="text-white font-mono pt-3 hover:text-green-400 font-bold"
              >
                {"-> launch ide"}
              </button>
            ) : (
              <p className="text-gray-400">loading ...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
