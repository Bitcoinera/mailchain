import { ethers } from "ethers";
// import daoContractABI from "./abis/daoAbi.json";
import parsiqContractABI from "./abis/parsiqAbi.json";
import { Mailchain } from "@mailchain/sdk";
import { config } from "dotenv";
config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

const secretRecoveryPhrase = process.env.SECRET_RECOVERY_PHRASE;
const mailchainAddress = process.env.MAILCHAIN_ADDRESS;
const mailchain = Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase);

async function smartContractListener() {
  //   const daoContractAddress = "0xAf072C8D368E4DD4A9d4fF6A76693887d6ae92Af";
  const ParsiqContractAddress = "0x362bc847A3a9637d3af6624EeC853618a43ed7D2";
  const provider = new ethers.providers.WebSocketProvider(
    `wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_WEBSOCKET}`
  );
  const contract = new ethers.Contract(
    ParsiqContractAddress,
    parsiqContractABI,
    provider
  );

  // console.log("Listening for motion enactions on the smart contract");
  console.log("Listening for transfers on the Parsiq smart contract");
  contract.on("Transfer", async (from, to, value, event) => {
    let info = {
      from: from,
      to: to,
      value: ethers.utils.formatUnits(value, 6),
      data: event,
    };
    // send email
    const result = await mailchain.sendMail({
      from: `bitcoinera@mailchain.com`, // sender address
      to: [mailchainAddress], // list of recipients (blockchain or mailchain addresses)
      subject: "Parsiq Transfer", // subject line
      content: {
        text: `${JSON.stringify(info)}`, // plain text body
        html: `<p>From: ${from}</p><p>To: ${to}</p><p>Value: ${ethers.utils.formatUnits(
          value
        )}</p><p>Data: ${JSON.stringify(event)}</p>`, // html body
      },
    });
    console.log("New Parsiq transfer detected:");
    console.log(result);
  });
}

export default smartContractListener;
