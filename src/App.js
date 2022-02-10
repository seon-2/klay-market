import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import QRCode from 'qrcode.react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faWallet, faPlus } from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css"
import './App.css';
import './market.css'
import { getBalance, readCount, setCount, fetchCardsOf } from './api/UseCaver';
import * as KlipAPI from "./api/UseKlip";
import { 
  Alert,
  Container,
  Card,
  Nav,
  Form,
  Button,
  Modal,
  Row,
  Col, 
} from 'react-bootstrap';
import { MARKET_CONTRACT_ADDRESS } from './constants';
import ModalHeader from 'react-bootstrap/esm/ModalHeader';
// 1 smart contrat 배포 주소 파악(가져오기)
// 2 caver.js 이용해서 컨트랙트 가져오기
// 3 가져온 컨트랙트 실행 결과(데이터) 웹에 표현하기

const DEFAULT_QR_CORD = "DEFAULT";
const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000"

function App() {
  // State Data

  // Global Data

  // address

  // nft
  const [nfts, setNFTs] = useState([]); // {id: '101', uri: ''}
  const [myBalance, setMyBalance] = useState("0");
  const [myAddress, setMyAddress] = useState(DEFAULT_ADDRESS);

  // UI
  const [qrvalue, setQrvalue] = useState(DEFAULT_QR_CORD);
  const [tab, setTab] = useState('MARKET');
  const [mintImageUrl, setMintImageUrl] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalProps, setModalProps] = useState({
    title: "MODAL",
    onConfirm: () => {},
  })

  const rows = nfts.slice(nfts.length / 2);

  // fetchMarketNFTs  마켓nft가져오는
  const fetchMarketNFTs = async () => {
    const _nfts = await fetchCardsOf(MARKET_CONTRACT_ADDRESS);
    setNFTs(_nfts);
  }


  // fetchmyNFTs  내 nft 가져오는
  // [ {tokenId : 100, tokenUri : "https://sjdflkjsdf.png"}, {tokenId : 101, tokenUri : "https://dfkhshfouhw.png"} ]
    // tokenId와 tokenUri를 인자로 가진 배열로
    // balanceOf : 내가 가진 전체 NFT 토큰 개수를 가져온다.
    // -> 2
    // tokenOfOwnerByIndex : 내가 가진 NFT tokenId를 하나씩 가져온다. 배열로
    // 0x058f878f26Bb1CbF2e4fb5c2E97f5911C67DC9CE, 0 -> 100
    // 0x058f878f26Bb1CbF2e4fb5c2E97f5911C67DC9CE, 1 -> 101
    // tokenURI : 앞에서 가져온 tokenId를 이용해서 tokenURI를 하나씩 가져온다.
    // 100 -> https://sjdflkjsdf.png
    // 101 -> https://dfkhshfouhw.png

  const fetchMyNFTs = async () => {
    if (myAddress == DEFAULT_ADDRESS) {
      alert("NO ADDRESS");
      return;
    }
    const _nfts = await fetchCardsOf(myAddress);
    setNFTs(_nfts);
  }
  // onClickMint  발행
  const onClickMint = async (uri) => {
    if (myAddress == DEFAULT_ADDRESS) {
      alert("NO ADDRESS");
      return;
    }
    const randomTokenId = parseInt( Math.random() * 10000000 );
    KlipAPI.mintCardWithURI(myAddress, randomTokenId, uri, setQrvalue, (result) => {
      alert(JSON.stringify(result));
    });
  };

  const onClickCard = (id) => {
    if (tab === 'WALLET') {
      setModalProps({
        title: "NFT를 마켓에 올리시겠습니까?",
        onConfirm: () => {
          onClickMyCard(id);
        },
      });
      setShowModal(true);
    }

    if (tab === 'MARKET') {
      setModalProps({
        title: "NFT를 구매하시겠습니까?",
        onConfirm: () => {
          onClickMarketCard(id);
        },
      });
      setShowModal(true);
    }
  }

  // onClickMyCard  매대에 올리는
  const onClickMyCard = (tokenId) => {
    KlipAPI.listingCard(myAddress, tokenId, setQrvalue, (result) => {
      alert(JSON.stringify(result));
    });
  };

  // onClickMarketCard  마켓에 있는 것 구입
  const onClickMarketCard = (tokenId) => {
    KlipAPI.buyCard(tokenId, setQrvalue, (result) => {
      alert(JSON.stringify(result));
    });
  };

  const getUserData = () => {
    setModalProps({
      title: "Klip 지갑을 연동하시겠습니까?",
      onConfirm: () => {
        KlipAPI.getAddress(setQrvalue, async (address) => {
          setMyAddress(address);
          const _balance = await getBalance(address);
          setMyBalance(_balance);
        });
      }
    })
    setShowModal(true);
  };

  useEffect(() => {
    getUserData();
    fetchMarketNFTs();
  }, [])

  return (
    <div className="App">
      <div style={{ backgroundColor: "black", padding: 10 }}>
        {/* 주소 잔고 */}
        <div 
          style={{
            fontSize: 30, 
            fontWeight: "bold", 
            paddingLeft: 5, 
            marginTop: 10,
          }}
        >
          내 지갑
        </div>
        {myAddress}
        <br />
        <Alert 
          onClick={getUserData}
          variant={"balance"} 
          style={{backgroundColor: "skyblue", fontSize: 25}}
        >
          {myAddress !== DEFAULT_ADDRESS ? `${myBalance} KLAY` : "지갑 연동하기"}
        </Alert>
        
        {/* QR CORD */}
        {qrvalue !== "DEFAULT" ? (
          <Container 
            style={{
              backgroundColor: "white", 
              width: 300,
              height: 300,
              padding: 20,
            }}
          >
            <QRCode value={qrvalue} size={256} style={{ margin: "auto"}} />
            <br />
            <br />
            <br />
          </Container>
        ) : null}

        {/* 갤러리(마켓, 내 지갑) */}
        {tab === "MARKET" || tab === "WALLET" ? 
          <div className='container' style={{padding:0, width: "100%"}}>
            {rows.map((o, rowIndex) => (
              <Row key={`rowkey${rowIndex}`}>
                <Col style={{ marginRight: 0, paddingRight: 0 }}>
                  <Card
                    onClick={() => {
                      onClickCard(nfts[rowIndex * 2].id);
                    }}
                  >
                    <Card.Img src={nfts[rowIndex * 2].uri} />
                  </Card>
                  [{nfts[rowIndex * 2].id}]NFT
                </Col>
                <Col style={{ marginRight: 0, paddingRight: 0 }}>
                  {nfts.length > rowIndex * 2 + 1 ? (
                    <Card
                      onClick={() => {
                        onClickCard(nfts[rowIndex * 2 + 1].id);
                      }}
                    >
                      <Card.Img src={nfts[rowIndex * 2 + 1].uri} />
                    </Card>
                  ) : null}
                  {nfts.length > rowIndex * 2 + 1 ? (
                    <>[{nfts[rowIndex * 2 + 1].id}]NFT</>
                  ) : null}
                </Col>
              </Row>
            ))}
            {/* {nfts.map((nft, index) => (
              <Card.Img 
                key={`imagekey${index}`}
                onClick={() => {
                  onClickCard(nft.id);
                }} 
                className='img-responsive' 
                src={nfts[index].uri} />
            ))} */}
          </div>
         : null}

        {/* 발행 페이지 */}
        {tab === "MINT" ? (
          <div className="container" style={{ padding: 0, width: "100%" }}>
            <Card
              className="text-center"
              style={{ color: "black", height: "50%", borderColor: "#C5B358" }}
            >
              <Card.Body style={{ opacity: 0.9, backgroundColor: "black" }}>
                {mintImageUrl !== "" ? (
                  <Card.Img src={mintImageUrl} height={"50%"} />
                ) : null}
                <Form>
                  <Form.Group>
                    <Form.Control
                      value={mintImageUrl}
                      onChange={(e) => {
                        console.log(e.target.value);
                        setMintImageUrl(e.target.value);
                      }}
                      type="text"
                      placeholder="이미지 주소를 입력해주세요"
                    />
                  </Form.Group>
                  <br />
                  <Button
                    onClick={() => {
                      onClickMint(mintImageUrl);
                    }}
                    variant="primary"
                    style={{
                      backgroundColor: "skyblue",
                      borderColor: "skyblue",
                    }}
                  >
                    발행하기
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </div>
        ) : null}
      </div>
      <br />
      <br />
      <br />

        {/* 모달 */}
        <Modal
        centered
        size="sm"
        show={showModal}
        onHide={() => {
          setShowModal(false);
        }}
      >
        <Modal.Header
          style={{ border: 0, backgroundColor: "black", opacity: 0.8 }}
        >
          <Modal.Title>{modalProps.title}</Modal.Title>
        </Modal.Header>
        <Modal.Footer
          style={{ border: 0, backgroundColor: "black", opacity: 0.8 }}
        >
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false);
            }}
          >
            닫기
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              modalProps.onConfirm();
              setShowModal(false);
            }}
            style={{ backgroundColor: "skyblue", borderColor: "skyblue" }}
          >
            진행
          </Button>
        </Modal.Footer>
      </Modal>

        {/* 탭 */}
        <nav
        style={{ backgroundColor: "#1b1717", height: 45 }}
        className="navbar fixed-bottom navbar-light"
        role="navigation"
      >
        <Nav className="w-100">
          <div className="d-flex flex-row justify-content-around w-100">
            <div
              onClick={() => {
                setTab("MARKET");
                fetchMarketNFTs();
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div><FontAwesomeIcon color="white" size="lg" icon={faHome} /></div>
            </div>

            <div
              onClick={() => {
                setTab("MINT");
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div><FontAwesomeIcon color="white" size="lg" icon={faPlus} /></div>
            </div>

            <div
              onClick={() => {
                setTab("WALLET");
                fetchMyNFTs();
              }}
              className="row d-flex flex-column justify-content-center align-items-center"
            >
              <div><FontAwesomeIcon color="white" size="lg" icon={faWallet} /></div>
            </div>

          </div>
        </Nav>
      </nav>
        
    </div> // className="App"
  );
}

export default App;
