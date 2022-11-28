import { ethers } from "ethers";
import daoContractABI from "./abis/daoAbi.json";
import { Mailchain } from "@mailchain/sdk";
import { config } from "dotenv";
config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

const secretRecoveryPhrase = process.env.SECRET_RECOVERY_PHRASE;
const mailchainAddress = process.env.MAILCHAIN_ADDRESS;
const mailchain = Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase);

async function smartContractListener() {
  const daoContractAddress = "0xAf072C8D368E4DD4A9d4fF6A76693887d6ae92Af";
  const provider = new ethers.providers.WebSocketProvider(
    `wss://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_WEBSOCKET}`
  );
  const contract = new ethers.Contract(
    daoContractAddress,
    daoContractABI,
    provider
  );

  console.log(
    "Listening for transfers on the Goerli Lido Finance DAO contract"
  );
  contract.on("MotionEnacted", async (id, to, data) => {
    let info = {
      id: id,
      to: to,
      data: data,
    };
    // send email
    const result = await mailchain.sendMail({
      from: `bitcoinera@mailchain.com`, // sender address
      to: [mailchainAddress], // list of recipients (blockchain or mailchain addresses)
      subject: "New motion enacted on Lido Finance", // subject line
      content: {
        text: `${JSON.stringify(info)}`, // plain text body
        html: `<p>Proposal id: ${id}</p>
          <p>Whatever this is: ${to}</p>
          <p>Data: ${JSON.stringify(data)}</p>`, // html body
      },
    });
    console.log(`New motion has been enacted:\n ${JSON.stringify(data)}`);
  });
}

export default smartContractListener;
