import './App.css';
import { useEffect, useState } from 'react';
const Buffer = require('buffer/').Buffer;
const ipfsApi = require('ipfs-api');
const ABI = require('./ABI.json');
const Web3 = require('web3');

function App() {

  const [ipfs, setIpfs] = useState();
  const [hash, setHash] = useState('');
  const [accounts, setAccounts] = useState();
  const [instance, setInstance] = useState();

  useEffect(() => {
    let _ipfs = new ipfsApi({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});
    setIpfs(_ipfs);

    if (window.ethereum) {
      let _web3 = new Web3(window.ethereum);
      let _instance = new _web3.eth.Contract(ABI, '0x6ef9397D59cD0eDcbF48115045f5A36c59C0833d');
      setInstance(_instance);

      window.ethereum.enable().then(async data => {
          let _accounts = await _web3.eth.getAccounts();
          setAccounts(_accounts);
      }).catch(console.error);
    }
  }, []);

  const captureFile = (event) => {
    event.stopPropagation();
    event.preventDefault();

    const file = event.target.files[0];
    let reader = new window.FileReader();

    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      saveToIpfs(reader);
    }
  }

  const getHashFromSC = async () => {
    const _hash = await instance.methods.getHash().call();
    setHash(_hash);
  }

  const saveToIpfs = (reader) => {
    const buffer = Buffer(reader.result);

    ipfs.files.add(buffer, async (err, result) => {
      if(err){
        console.error(err);
        return;
      }

      //Storing to smart contract
      await instance.methods.setHash(result[0].hash).send({from: accounts[0]});

      //Fetching hash from smart contract to retrieve image from ipfs
      getHashFromSC();
    });
  }

  return (
    <div className="App">
      <input type='file' onChange={captureFile} accept="image/*"/>
      {hash === '' ? null : 
      <div>
        <p>Hash of the file: {hash}</p>
        <img src={`https://ipfs.io/ipfs/${hash}`} alt='No image available' style={{
          marginTop: '20px'
        }}/>
      </div>
      }
    </div>
  );
}

export default App;
