import { Col, Row, notification, Modal, Alert, Button } from "antd";
import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useGasPrice,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch} from "react-router-dom";
import "./App.css";
import { Account, Contract, Header, NetworkDisplay, NetworkSwitch } from "./components";
import { NETWORKS, INFURA_ID } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import { Transactor, Web3ModalSetup } from "./helpers";
import { useStaticJsonRPC } from "./hooks";

import sanityClient from "./client.js";
import Logo from "./images/bp_logo_512.png";
import "./myCss.css";
import OnePost from "./OnePost";
import newGmn from "./newGMN.json";
import gmnabi from "./gmnabi.json";
import ABI from "./ABI.json"
import imageUrlBuilder from "@sanity/image-url";

import MailchimpSubscribe from "react-mailchimp-subscribe";
import twitterLogo from "./images/twitterLogo.svg";
import discordLogo from "./images/discordLogo.svg";

const CustomForm = ({ status, message, onValidated }) => {

  const sendNotification = (type, data) => {
    return notification[type]({
      ...data,
      placement: "bottomRight",
    });
  };

  let email;
  const submit = () =>
    email &&
    email.value.indexOf("@") > -1 &&
    onValidated({
      EMAIL: email.value
    });

    return (
      <div>
     
        {status === "success" && 
                sendNotification("success", {
                  message: "Subscribed!",
                  description: `Thank you for subscribing to Good Morning News`,
                })
        }
        <input
          style={{ fontSize: "1em", padding: 5, borderRadius: "5px", backgroundColor: "rgba(255,255,255,0.1)", marginRight: "5px" }}
          ref={node => (email = node)}
          type="email"
          placeholder="email"
        />

        <button className="sub-btn" style={{ fontSize: "1em", padding: 5, marginTop: "10px", border: "1px solid #fff", borderRadius: "10px" }} onClick={submit}>
          Subscribe
        </button>
      </div>
    );
  };

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.polygon; // <------- select your target frontend network (localhost, goerli, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = false; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://mainnet.infura.io/v3/${INFURA_ID}`,
  "https://rpc.scaffoldeth.io:48544",
];

function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = [initialNetwork.name, "mainnet", "goerli"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);


  const targetNetwork = NETWORKS[selectedNetwork];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, USE_BURNER_WALLET);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // const contractConfig = useContractConfig();

  const contractConfig = { externalContracts: externalContracts };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);





  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);

      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
    localChainId,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [allPostsData, setAllPosts] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [open, setOpen] = useState();
  const [subd, notSubd] = useState(false);
  const [goMint, setMint] = useState(false);


  const builder = imageUrlBuilder(sanityClient);
  function urlFor(source) {
    return builder.image(source);
  }

  const sendNotification = (type, data) => {
    return notification[type]({
      ...data,
      placement: "bottomRight",
    });
  };

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type == "post"] | order(publishedAt desc){
            title,
            slug,
            publishedAt,
            "name": author->name,
            "authorImage": author->image,
            mainImage{
              asset->{
                _id,
                url
              }
            }
          }`,
      )
      .then(data => setAllPosts(data))
      .catch(console.error);
  }, []);

  console.log(allPostsData);

  // Sign In With Ethereum

  const handleSignIn = async () => {
    if (web3Modal.cachedProvider === "") {
      return sendNotification("error", {
        message: "Failed to Sign In!",
        description: "Please Connect a wallet before Signing in",
      });
    }

    setIsSigning(true);

    try {
      // sign message using wallet
      const message = `GMN Verify`;
      const address = await userSigner.getAddress();
      let signature = await userSigner.signMessage(message);

      const isValid = await validateUser(message, address, signature);

      if (!isValid) {
        throw new Error("Your are either not a holder or your subscription has expired.");
      }

      setIsAuth(isValid);

      // notify user of sign-in
      sendNotification("success", {
        message: "Welcome back " + address.substr(0, 6) + "...",
      });
    } catch (error) {
      sendNotification("error", {
        message: "Verification Failed!",
        description: `Connection issue - ${error.message}`,
      });
    }

    setIsSigning(false);
  };

  // Token Gate 🚫
  const validateUser = async (message, address, signature) => {
    // validate signature
    const recovered = ethers.utils.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return false;
    }

    try {
      // validate token balance
      const tokenAddress = "0x12A0FA1A6029FF9b137b80Da429704A1251D5400";
      const tokenContract = new ethers.Contract(tokenAddress, ABI, userSigner);
      const balance = await tokenContract.balanceOf(address);
      const id = await tokenContract.tokenOfOwnerByIndex(address, "0");
      const parsedId = Number(ethers.utils.hexlify(id));
      const subCheck = await tokenContract.subCheck(parsedId);
      console.log(subCheck)
      console.log(parsedId)
      console.log(balance)
      if (subCheck === "Subscribed") {
        return balance.gt(0);
      } else {
        notSubd(true);
      }
    } catch (error) {
      setMint(true);
      console.log(error);
      return false;
    }

  };

   function search() {
    // Declare variables
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('myInput');
    filter = input.value;
    ul = document.getElementById("myUL");
    li = ul.getElementsByTagName('li');
  
    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
      a = li[i].getElementsByTagName("a")[0];
      txtValue = a.textContent || a.innerText;
      if (txtValue.indexOf(filter) > -1) {
        li[i].style.display = "";
      } else {
        li[i].style.display = "none";
      }
    }
  }


  return (
    <div className="App background">

    <div className="twitterContainer">
            <a href="https://twitter.com/GMN_NFT" target="_blank" rel="noreferrer">
              <img 
              src={twitterLogo}
              alt="twitter"
              style={{width: "30px", height: "30px", transform: "rotate(-90deg)"}}
              ></img>
            </a>
      </div>

      <div className="discordContainer">
            <a href="https://discord.gg/sZSJbsZeez" target="_blank" rel="noreferrer">
              <img 
              src={discordLogo}
              alt="substack"
              style={{width: "30px", height: "30px", transform: "rotate(-90deg)"}}
              ></img>
            </a>
      </div>


      {/* ✏️ Edit the header and change the title to your project name */}
      <Header>
        {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flex: 1 }}>
            {USE_NETWORK_SELECTOR && (
              <div style={{ marginRight: 20 }}>
                <NetworkSwitch
                  networkOptions={networkOptions}
                  selectedNetwork={selectedNetwork}
                  setSelectedNetwork={setSelectedNetwork}
                />
              </div>
            )}
            <Account
              useBurner={USE_BURNER_WALLET}
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              mainnetProvider={mainnetProvider}
              price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
          </div>
        </div>
      </Header>

{goMint && (
          <><div style={{ zIndex: 2, position: "fixed", left: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Mint New Subscription"
            description={<div>
              
              <Button
                onClick={async () => {
                  const contract = new ethers.Contract("0x12A0FA1A6029FF9b137b80Da429704A1251D5400", ABI, userSigner);
                  const cost = contract.cost();
                  const result = tx(contract.mint( { value: cost }), update => {
                    console.log("📡 Transaction Update:", update);
                    if (update && (update.status === "confirmed" || update.status === 1)) {
                      setIsAuth(true);
                      setMint(false);
                      sendNotification("success", {
                        message: "Minted",
                        description: `You can now view any article of your choice.`,
                      });
                      console.log(" 🍾 Transaction " + update.hash + " finished!");
                      console.log(
                        " ⛽️ " +
                          update.gasUsed +
                          "/" +
                          (update.gasLimit || update.gas) +
                          " @ " +
                          parseFloat(update.gasPrice) / 1000000000 +
                          " gwei",
                      );
                    }
                  });
                  console.log("awaiting metamask/web3 confirm result...", result);
                  console.log(await result);
                }}>
                <b>Mint</b>
              </Button>
            </div>}
            type="success"
            closable={false} />
        </div></>
)}

{subd && (
        <><div style={{ zIndex: 2, position: "fixed", right: 0, top: 60, padding: 16 }}>
            <Alert
              message="⚠️ Your Subscription Has Expired!"
              description={<div>
                Please burn your current token...
                <Button
                  onClick={async () => {
                    const contract = new ethers.Contract("0x12A0FA1A6029FF9b137b80Da429704A1251D5400", ABI, userSigner);
                    const id = await contract.tokenOfOwnerByIndex(address, "0");
                    const parsedId = Number(ethers.utils.hexlify(id));
                    const result = tx(contract.burn(parsedId), update => {
                      console.log("📡 Transaction Update:", update);
                      if (update && (update.status === "confirmed" || update.status === 1)) {
                        setMint(true);
                        notSubd(false);
                        sendNotification("success", {
                          message: "Burned!",
                          description: `Old subscription burned. Please mint new token to renew subscription.`,
                        });
                        console.log(" 🍾 Transaction " + update.hash + " finished!");
                        console.log(
                          " ⛽️ " +
                          update.gasUsed +
                          "/" +
                          (update.gasLimit || update.gas) +
                          " @ " +
                          parseFloat(update.gasPrice) / 1000000000 +
                          " gwei"
                        );
                      }
                    });
                    console.log("awaiting metamask/web3 confirm result...", result);
                    console.log(await result);
                  }}>
                  <b>Burn!</b>
                </Button>
              </div>}
              type="error"
              closable={false} />
          </div></>
  )
}


{isAuth && (
      <><div className="subscribe">
          <MailchimpSubscribe
            url="https://gmail.us21.list-manage.com/subscribe/post?u=9dac44c0db4dc93dfe2c9fec9&id=d51751ba11"
            render={({ subscribe, status, message }) => (
              <CustomForm
                status={status}
                message={message}
                onValidated={formData => subscribe(formData)} />
            )} />
        </div><div className="editorContainer">
            <a href="https://gmn-sanity.vercel.app/" target="_blank" rel="noreferrer">
              <h6 className="editorText">Editors</h6>
            </a>
          </div></>
      
)}

      <Modal
        id="singleModal"
        visible={open}
        onOk={ async () => {

          var getHeadline = "textContent" in document.body ? "textContent" : "innerText";
          const headline = document.title = document.getElementsByTagName("h1")[0][getHeadline];
          console.log(headline)

          var getStory = "textContent" in document.body ? "textContent" : "innerText";
          const story = document.title = document.getElementsByTagName("p")[0][getStory];
          console.log(story)

          const contract = new ethers.Contract("0x5eEAD112B4A412799c95d18CD995f55860626BD5", newGmn, userSigner);
          const result = tx(contract.CreateNewIssue("" + story, "" + headline, address), update => {
            console.log("📡 Transaction Update:", update);
            if (update && (update.status === "confirmed" || update.status === 1)) {
              sendNotification("success", {
                message: "Minted",
                description: `Thank you for minting an issue of Good Morning News🙏`,
              });
              console.log(" 🍾 Transaction " + update.hash + " finished!");
              console.log(
                " ⛽️ " +
                  update.gasUsed +
                  "/" +
                  (update.gasLimit || update.gas) +
                  " @ " +
                  parseFloat(update.gasPrice) / 1000000000 +
                  " gwei",
              );
            }
          });
          console.log("awaiting metamask/web3 confirm result...", result);
          console.log(await result);
        }}
        okText="Mint Issue"
        onCancel={() => {
          setOpen(!open);
        }}
        cancelText="Close"
        width={"100%"}
      >
        <Row>
          <Col>
            <Route component={OnePost} path="/:slug" />
    
          </Col>
        </Row>
      </Modal>

      <a
        href="https://gmn-german-final.vercel.app/"
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: "none", color: "#fff" }}
      >
        <button
          className="mint"
          style={{
            position: "fixed",
            bottom: "10px",
            left: "24px",
            display: "block",
            width: "auto",
            cursor: "pointer",
            zIndex: "10",
          }}
          type="default"
        >
          German Edition
        </button>
      </a>

      <div className=" p-12 mobile" style={{ marginBottom: "0px" }}>
        <div className="container mx-auto">
          <img className=" logo" style={{ paddingTop: "100px" }} src={Logo} alt="logo"></img>

          <button
            className="verify"
            style={{
              marginBottom: "12px",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              width: "15%",
              minWidth: "175px",
            }}
            onClick={handleSignIn}
            loading={isSigning}
          >
            Verify
          </button>

 
          {isAuth && (
        
          <><input type="text" id="myInput" onKeyUp={search} className="searchBar" placeholder="Search..."></input><div>
              <ul id="myUL">
                {allPostsData &&
                  allPostsData.map((post, index) => (
                    <li style={{ display: "none" }}>
                      <Link to={"/" + post.slug.current} key={post.slug.current}>
                        <a
                          onClick={() => {
                            setOpen(!open);
                          } }>
                          {post.title}
                        </a>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div></>
      
          )}

        </div>
      </div>

      <div className="min-h-screen p-12">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" id="allPosts">
            {allPostsData &&
              allPostsData.map((post, index) => (
                <span
                  className="block h-64 relative rounded shadow leading-snug bg-black border-l-8 "
                  style={{ borderColor: "#313131" }}
                  key={index}
                >
                  <img
                    className="w-full h-full rounded-r object-cover absolute"
                    src={post.mainImage.asset.url}
                    alt=""
                  />
                  <span className="block relative h-full flex justify-start items-start pr-4 pb-4">
                    <h6
                      className=" font-bold px-3 py-3 text-red-100 flag"
                      style={{ position: "absolute", right: "0", bottom: "0" }}
                    >
                      <span>
                        <img
                          src={urlFor(post.authorImage).url()}
                          className="w-5 h-5 rounded-full"
                          alt="Author: Pub"
                          style={{ float: "left", marginRight: "3px" }}
                        />
                      </span>
                      <span> {post.name}</span>
                    </h6>

                    <span>
                      {isAuth && (
                        <Link to={"/" + post.slug.current} key={post.slug.current}>
                          <button
                            onClick={() => {
                              setOpen(!open);
                            }}
                            className="view-btn"
                            style={{ position: "absolute", left: "10px", bottom: "10px" }}
                          >
                            view
                          </button>
                        </Link>
                      )}
                    </span>
                  </span>
                </span>
              ))}
          </div>
        </div>
      </div>

      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />

      <Switch>
        <Route exact path="/debug">
          {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

          <Contract
            name="YourContract"
            price={price}
            signer={userSigner}
            provider={localProvider}
            address={address}
            blockExplorer={blockExplorer}
            contractConfig={contractConfig}
          />
        </Route>
      </Switch>
    </div>
  );
}

export default App;
