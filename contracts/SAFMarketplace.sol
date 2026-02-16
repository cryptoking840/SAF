// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SAFMarketplace {

    // -----------------------------
    // ROLES
    // -----------------------------

    address public registry;

    mapping(address => bool) public suppliers;
    mapping(address => bool) public inspectors;
    mapping(address => bool) public airlines;

    modifier onlyRegistry() {
        require(msg.sender == registry, "Only registry allowed");
        _;
    }

    modifier onlySupplier() {
        require(suppliers[msg.sender], "Only supplier allowed");
        _;
    }

    modifier onlyInspector() {
        require(inspectors[msg.sender], "Only inspector allowed");
        _;
    }

    modifier onlyAirline() {
        require(airlines[msg.sender], "Only airline allowed");
        _;
    }

    // -----------------------------
    // STRUCTS
    // -----------------------------

    enum Status {
        REGISTERED,
        INSPECTED,
        CERTIFIED,
        LISTED,
        BID_PLACED,
        BID_ACCEPTED,
        TRANSFERRED,
        RETIRED
    }

    struct SAFc {
        uint256 id;
        uint256 parentId;
        uint256 originalQuantity;
        uint256 remainingQuantity;
        address owner;
        bool isListed;
        Status status;
    }

    struct Bid {
        uint256 id;
        uint256 certificateId;
        address airline;
        uint256 quantity;
        uint256 price;
        bool accepted;
        bool approvedByRegistry;
    }

    // -----------------------------
    // STORAGE
    // -----------------------------

    uint256 public certificateCounter;
    uint256 public bidCounter;

    mapping(uint256 => SAFc) public certificates;
    mapping(uint256 => Bid) public bids;

    mapping(uint256 => uint256[]) public certificateBids;
    mapping(uint256 => uint256[]) public childCertificates;

    // -----------------------------
    // EVENTS
    // -----------------------------

    event SAFRegistered(uint256 certId, address supplier);
    event SAFApproved(uint256 certId);
    event Listed(uint256 certId);
    event BidPlaced(uint256 bidId);
    event BidAccepted(uint256 bidId);
    event TradeApproved(uint256 bidId, uint256 newChildId);

    // -----------------------------
    // CONSTRUCTOR
    // -----------------------------

    constructor() {
        registry = msg.sender;
    }

    // -----------------------------
    // ROLE MANAGEMENT
    // -----------------------------

    function addSupplier(address _addr) external onlyRegistry {
        suppliers[_addr] = true;
    }

    function addInspector(address _addr) external onlyRegistry {
        inspectors[_addr] = true;
    }

    function addAirline(address _addr) external onlyRegistry {
        airlines[_addr] = true;
    }

    // -----------------------------
    // SAF REGISTRATION (Registry Controlled)
    // -----------------------------

    function registerSAF(
        uint256 quantity,
        address supplierWallet
    ) external onlyRegistry {

        require(suppliers[supplierWallet], "Supplier not approved");

        certificateCounter++;

        certificates[certificateCounter] = SAFc({
            id: certificateCounter,
            parentId: 0,
            originalQuantity: quantity,
            remainingQuantity: quantity,
            owner: supplierWallet,
            isListed: false,
            status: Status.CERTIFIED
        });

        emit SAFRegistered(certificateCounter, supplierWallet);
    }

    // -----------------------------
    // MARKETPLACE
    // -----------------------------

    function listCertificate(uint256 certId) external onlySupplier {
        SAFc storage cert = certificates[certId];

        require(cert.owner == msg.sender, "Not owner");
        require(cert.status == Status.CERTIFIED, "Not certified");
        require(cert.remainingQuantity > 0, "No quantity");

        cert.isListed = true;
        cert.status = Status.LISTED;

        emit Listed(certId);
    }

    function placeBid(uint256 certId, uint256 quantity, uint256 price)
        external
        onlyAirline
    {
        SAFc storage cert = certificates[certId];

        require(cert.isListed, "Not listed");
        require(quantity <= cert.remainingQuantity, "Exceeds balance");

        bidCounter++;

        bids[bidCounter] = Bid({
            id: bidCounter,
            certificateId: certId,
            airline: msg.sender,
            quantity: quantity,
            price: price,
            accepted: false,
            approvedByRegistry: false
        });

        certificateBids[certId].push(bidCounter);

        emit BidPlaced(bidCounter);
    }

    function acceptBid(uint256 bidId) external onlySupplier {
        Bid storage bid = bids[bidId];
        SAFc storage cert = certificates[bid.certificateId];

        require(cert.owner == msg.sender, "Not owner");

        bid.accepted = true;
        cert.status = Status.BID_ACCEPTED;

        emit BidAccepted(bidId);
    }

    function approveTrade(uint256 bidId) external onlyRegistry {
        Bid storage bid = bids[bidId];
        SAFc storage parent = certificates[bid.certificateId];

        require(bid.accepted, "Not accepted");
        require(bid.quantity <= parent.remainingQuantity, "Invalid qty");

        parent.remainingQuantity -= bid.quantity;

        certificateCounter++;

        certificates[certificateCounter] = SAFc({
            id: certificateCounter,
            parentId: parent.id,
            originalQuantity: bid.quantity,
            remainingQuantity: bid.quantity,
            owner: bid.airline,
            isListed: false,
            status: Status.TRANSFERRED
        });

        childCertificates[parent.id].push(certificateCounter);

        bid.approvedByRegistry = true;

        if (parent.remainingQuantity == 0) {
            parent.status = Status.TRANSFERRED;
        }

        emit TradeApproved(bidId, certificateCounter);
    }
}
