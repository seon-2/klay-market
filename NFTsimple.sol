pragma solidity >=0.4.24 <=0.5.6;

contract NFTsimple {
    
    string public name = "KlayLion";
    string public symbol = "KL"; // 단위

    mapping (uint256 => address) public tokenOwner; // id -> 주소 : 토큰 소유주
    mapping (uint256 => string) public tokenURIs; // 컨텐츠

    // 소유한 토큰 리스트
    mapping (address => uint256[]) private _ownedToken; // 누가 얼마나 가지고 있는지 배열로

    // onKIP17Received bytes value
    bytes4 private constant _KIP17_RECEICVED = 0x6745782b;

    // mint(tokenId, uri, owner) 발행
    // transferFrom(from, to, tokenId) 전송 : owner가 바뀜 (from -> to)

    function mintWithTokenURI(address to, uint256 tokenId, string memory tokenURI) public returns (bool) {
        // to에게 tokenId(일련번호)를 발행하겠다.
        // 적힐 글자(컨텐츠)는 tokenURI
        tokenOwner[tokenId] = to;
        tokenURIs[tokenId] = tokenURI;

        // 리스트에 토큰 추가
        _ownedToken[to].push(tokenId);

        return true;
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public {
        require(from == msg.sender, "보내는 사람과 요청자가 동일인물이 아닙니다.");
        require(from == tokenOwner[tokenId], "보내는 사람이 토큰 소유주가 아닙니다.");

        _removeTokenFromList(from, tokenId);
        _ownedToken[to].push(tokenId);

        tokenOwner[tokenId] = to;

        // 만약, 받는 쪽이 실행할 코드가 있는 컨트랙트라면 코드를 실행할 것
        require (
            _checkOnKIP17Received(from, to, tokenId, _data), "KIP17: transfer to non KIP17Receiver implementer"
        );
    }

    function _checkOnKIP17Received(address from, address to, uint256 tokenId, bytes memory _data) internal returns (bool) { // 내부에서만 사용
        bool success;
        bytes memory returndata;

        if (!isContract(to)) {
            return true;
        }

        (success, returndata) = to.call( // 그 주소로 가서 실행
            abi.encodeWithSelector(
                _KIP17_RECEICVED, // function onKIP17Received() 실행 
                msg.sender,
                from,
                tokenId,
                _data
            )
        );

        if (
            returndata.length != 0 && // 리턴값 있고
            abi.decode(returndata, (bytes4)) == _KIP17_RECEICVED 
        ) {
            return true;
        }
        return false;
    }

    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {size := extcodesize(account)} // 코드가 존재하는지. 존재하면 size > 0
        return size > 0;
    }

    function _removeTokenFromList(address from, uint256 tokenId) private {
        // 타켓을 찾아 배열 끝으로 보내서 배열의 길이를 줄이는 로직
        uint256 lastTokenIndex = _ownedToken[from].length - 1;
        for (uint256 i=0; i<_ownedToken[from].length;i++) {
            if (tokenId == _ownedToken[from][i]) {
                _ownedToken[from][i] = _ownedToken[from][lastTokenIndex];
            }
        }
        _ownedToken[from].length--;
    }

    function ownedTokens(address owner) public view returns (uint256[] memory) {
        return _ownedToken[owner];
    }

    function setTokenUri(uint256 id, string memory uri) public {
        tokenURIs[id] = uri;
    }

    // function balanceOf(address owner) public view returns (uint256) {
    //     require(
    //         owner != address(0),
    //         "KIP17: balance query for the zero address"
    //     );
    //     return _ownedToken[owner].length;
    // }
}

// 발행, 조회는 NFTsimple
// 판매 : 마켓에게 전송
// 구매 : 마켓에서 buy실행. 0.01KL(가격)를 매대에 올린 사람에게 보내야 함.

contract NFTmarket {
    mapping(uint256 => address) public seller; // 토큰을 보낸 사람. 판매자

    function buyNFT (uint256 tokenId, address NFTaddress) public payable returns (bool) {
        
        // 구매한 사람에게 0.01KLAY 전송
        address payable receiver = address(uint160(seller[tokenId])); //payable 붙이면 코드 상에서 돈 보내는 거 가능

        // receiver에게 0.01 KLAY 보내기
        // 10 ** 18 PEB = 1 KLAY
        // 10 ** 16 PEB = 0.01 KLAY
        receiver.transfer(10 ** 16);

        NFTsimple(NFTaddress).safeTransferFrom(address(this), msg.sender, tokenId, "0x00");

        return true;
    }
    // 마켓이 토큰을 받았을 때 (판매대에 올라왔을 때) 판매자(토큰 보낸 사람)가 누구인지
    function onKIP17Received(address operator, address from, uint256 tokenId, bytes memory data) public returns (bytes4) {
        seller[tokenId] = from;

        return bytes4(keccak256("onKIP17Received(address,address,uint256,bytes)"));
    }
}