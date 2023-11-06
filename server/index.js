const express = require("express");
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const {toHex, utf8ToBytes} = require("ethereum-cryptography/utils")

const app = express();
const cors = require("cors");

const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "04bd56227ecd3ec6d11e3549e868d1f5526766c016530dd20885f3e68ddc7f43926ae9d5ae1f2de1eda4784b15fe6d05b4b7db4bb231a9442547e8aaefed118e83": 100,
  "04ea90e549cafbbb5813ec5801ef696276bc82228a11b78436e8cd2e732338eed53085b3cac7a7fe992934a9835e14f32c483a31280cc09435108129bba7c50b3f": 50,
  "04fbfabc1dd7de392a2066ba2c8fb76577256d49a5ce3a8015f3a317480b5d7a3bfce6618c6a62603c5a7f0b483872ba234560fef51e48ca5bb07f5211391bec77": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", async (req, res) => {
  const { sender, recipient, amount, signature, recovery } = req.body;

  if(!signature) res.status(404).send({ message: "signature dont was provide" });
  if(!recovery) res.status(400).send({ message: "recovery dont was provide" });

  try {
    
    const bytes = utf8ToBytes(JSON.stringify({ sender, recipient, amount }));
    const hash = keccak256(bytes);

    const sig = new Uint8Array(signature);

    const publicKey = await secp.recoverPublicKey(hash, sig, recovery);

    if(toHex(publicKey) !== sender){
      res.status(400).send({ message: "signature no is valid" });
    }

    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  } catch (error) {
    console.log(error.message)
  }
  
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
