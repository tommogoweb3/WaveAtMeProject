import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState(""); // Just a state variable we use to store our user's public wallet.

  const [allWaves, setAllWaves] = useState([]); // All state property to store all waves
  const contractAddress = "0x8Ca16DC6F031CB4b52ECa06036824287f7994515";
  const contractABI = abi.abi;
  const [msg, setMessage] = useState("");

  // get all waves function talking to the deployed contract in the blockchain
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves(); // call getAllWaves from smart contract
        console.log(waves); // optinal check on waves
        //picking out address,timestamp, message for the UI

        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });
        setAllWaves(wavesCleaned); // store our data in React State

      } else {
        console.log("Ethereum object doesn't exist.")
      }
    } catch (error) {
      console.log(error);
    }
  }
  //here we listen to NewWave Smart Contract Emissions, and update log real time if needed
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };

  }, [])

  const checkIfWalletIsConnected = async () => {
    try {
      //First make sure we have access to window.ethereum
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have Metamask!");
        return;
        //return; line would be interesting to play wiht to see what this does (!)
      } else {
        console.log("We have the ethereum object", ethereum);
      }
    
      //Check if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllWaves(); //calling getAllWaves function when account logged in to site

      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  //Implement your connectWallet method here
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllWaves(); //calling getAllWaves function when account connects to site
    } catch (error) {
      console.log(error);
    }
  }
  // wave function talking to the deployed blockchain contract
  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retreived total wave count...", count.toNumber());

        //execute the actual wave function from smart contract
        const waveTxn = await wavePortalContract.wave(msg, { gasLimit: 300000 }); //push msg as message to store, and set gas limit to 300,000
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Total wave count is now...", count.toNumber());

      } else {
        console.log("Ethereum object doesn't exist.");
      }
    } catch (error) {
      console.log(error);
      }
  }
  // This runs our function when the page loads.
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  // Front end
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
        I am Tamas and it is my first web3 dapp. Connect your Ethereum wallet and wave at me!
        </div>
        <div id="message-box" class="textBox">
          <input
            id="message"
            type="text"
            class="textBoxInput"
            required
            placeholder="Your message goes here, pls be nice!"
            onChange={(e) => setMessage(e.target.value)}
            />
        </div>
        <button className="waveButton" onClick={wave}>
          WAVE
        </button>

        {/*
        * If there is no currentAccount render this buttonn
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
          Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
          })}
      </div>
    </div>
  );
}

export default App
