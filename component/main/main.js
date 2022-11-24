import Oneroom from "./oneroom.js";

const filter = document.querySelectorAll(".filter__select");

const CRITERIA_MAP_LEVEL = 7;
const oneroom = new Oneroom();
const local = [
  { id: "강원도", name: "강원도", lat: "37.555837", lng: "128.209315" },
  { id: "충청남도", name: "충청남도", lat: "36.557229", lng: "126.779757" },
  { id: "광주광역시", name: "광주", lat: "35.126033", lng: "126.831302" },
  { id: "대구광역시", name: "대구", lat: "35.798838", lng: "128.583052" },
  { id: "대전광역시", name: "대전", lat: "36.321655", lng: "127.378953" },
  { id: "경상북도", name: "경상북도", lat: "36.248647", lng: "128.664734" },
  { id: "경상남도", name: "경상남도", lat: "35.259787", lng: "128.664734 " },
  { id: "부산광역시", name: "부산", lat: "35.198362", lng: "129.053922" },
  { id: "울산광역시", name: "울산", lat: "35.519301", lng: "129.239078" },
  // { id: "경기도", name: "경기도", lat: "37.567167", lng: "127.190292" },
  // { id: "인청광역시", name: "인천", lat: "37.469221", lng: "126.573234" },
  // { id: "서울특별시", name: "서울", lat: "37.5642135", lng: "127.0016985" },
  { id: "수도권", name: "수도권", lat: "37.5642135", lng: "127.0016985" },
];
const localOverlayList = [];
const subwayOverlayList = [];
let roomCluster = null;
let roomClusterState = false; //true면 지도 레벨이 낮을때 roomCluster만 보이게된다, //false면 지도 레벨이 낮을때 subwayOverlay만 보이게된다.
let roomAndMarker = null;
let markers = null;
let oneroomList_resolved = null;

/**
 * !설명
 * 지역, 지하철은 customOverlay로 만들었다. 방은 cluster로 만들었다.
 *
 * !지도 이용 순서
 * 1. init()함수로 지역, 지하철 오버레이를 생성한다.
 * 2. 지하철 오버레이를 클릭하면 방 클러스터가 생성된다.
 * 3. 방을 리스트로 보여주며, 모든 방에 대해 필터적용, 각 방에 대한 세권찾기
 */
//* 필터, 세권 만들기

// 지도 생성
const map = new kakao.maps.Map(document.getElementById("map"), {
  center: new kakao.maps.LatLng(37.53886742395844, 126.98678427911392),
  level: 8,
  maxLevel: 12,
});

kakao.maps.event.addListener(map, "click", function (mouseEvent) {
  // console.log(mouseEvent.latLng);
  console.log(map.getLevel());
  console.log(roomCluster);
});

// ! 오버레이에 이벤트를 등록해야하는 상황
// !1.에서 처음부터 생성.. 사용자 위치를 기준으로 지도레벨 확대해서 지하철부터 보여줄까???????
// 1. 새 오버레이 생성 (로컬의 경우 처음부터 생성되었기때문에 이때 적용함, subway랑 매물은 아님)
// 2. 지도확대 축소후 새로 생긴 오버레이
// 3. 지도 이동후 새로생긴 오버레이
// ^ 지도의 드래그가 끝났을때 화면에 보여지는 오버레이에 이벤트 등록
kakao.maps.event.addListener(map, "dragend", function () {
  overlaySetEvent();
});
let resultMarkerList = [];

/**
 * ^ 지도 레벨에 따라 지역, 지하철, 방을 보여준다.
 * ^ 보여지는 오버레이에 클릭이벤트를 등록한다.
 */
kakao.maps.event.addListener(map, "zoom_changed", function (mouseEvent) {
  // 5이하 : 매물, 6~8 : 지하철, 9이상 : 지역
  if (5 < map.getLevel() && map.getLevel() < 8) {
    console.log("지하철 오버레이");
    localOverlayList.forEach((localOverlay) => localOverlay.setMap(null));
    subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(map));
    displayRoomCluster(false);
    createCardList();
  } else if (map.getLevel() <= 5) {
    if (roomClusterState) {
      console.log("줌이 바뀌었는데 방정보 있을때");
      displayRoomCluster(true);
      createCardList(oneroomList_resolved);
      localOverlayList.forEach((localOverlay) => localOverlay.setMap(null));
      subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(null));
    } else {
      console.log("줌이 바뀌었는데 방정보 없을때");
      localOverlayList.forEach((localOverlay) => localOverlay.setMap(null));
      subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(map));
    }
  } else {
    console.log("로컬 오버레이 보여줘");
    localOverlayList.forEach((localOverlay) => localOverlay.setMap(map));
    subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(null));
    createCardList();
  }

  overlaySetEvent();
});

//* ============================== 방 정보, 방 클러스터 관련 함수 =================================
/**
 * ^ 역 주변 매물정보를 요청하여 위치를 클러스터로 나타낸다.
 */
async function getOneRoomCluster(subway) {
  loading(true);

  let oneroomList = await oneroom.getRoomData(subway); // 프로미스 배열이 있음, await 안쓰면 프로미스 안에 프로미스배열이 있음

  // oneroomList를 foreach 돌려서 async 안에 async의 흐름 확인해보기
  Promise.all(oneroomList).then((oneroomList) => {
    createCluster(oneroomList);
    // createCardList(oneroomList);
    oneroomList_resolved = oneroomList;
    loading(false);
  });
}

/**
 * ^ 방 정보를 받아 cardList를 생성한다.
 * @param {*} oneroomList [{원룸 정보}, {원룸 정보} ...]
 * * 생성
 * 1. 클러스터 클릭시 카드 생성
 * 2. 지하철, 지역상태에서 확대했는데 방 정보가 있을때
 *
 * * 삭제
 * 1. 지도 축소 해서 지하철, 지역이 보일때
 */
function createCardList(oneroomList = null) {
  const cardBox = document.querySelector(".card-box");
  const cards = cardBox.querySelector("ul.cards");

  while (cards.firstChild) {
    cards.removeChild(cards.firstChild);
  }

  if (oneroomList === null) {
    console.log("널입니다.");
    cards;
    return;
  }
  console.log("실행");
  oneroomList_resolved = oneroomList;
  oneroomList.forEach((oneroom) => {
    let item = oneroom.item;
    let price = ``;
    let size = ``;
    oneroom.floor != null
      ? (size = `${getPyeong(item.전용면적_m2)}평 ${item.floor}층`)
      : (size = `${getPyeong(item.전용면적_m2)}평 ${item.floor_string}층`);

    let type = item.sales_type;
    switch (type) {
      case "월세":
        price = `${oneroom.item.보증금액} / ${oneroom.item.월세금액}`;
        break;
      case "전세":
        price = `${oneroom.item.보증금액}`;
        break;
      case "매매":
        console.log("매매");
    }
    let element = `<li class="card">
    <div class="card__text">
      <div class="card__price">${type} ${price}</div>
      <div class="card__size">${size}</div>
      <div class="card__addr">${item.local2} ${item.local3}</div>
      <div class="card__description">
        ${item.description}
      </div>
    </div>
    <div class="card__image">
      <img
        src=${item.image_thumbnail}?w=400&h=300&q=70&a=1
        alt="썸네일"
      />
    </div>
  </li>`;
    cards.insertAdjacentHTML("beforeend", element);
  });
}

/**
 * ^좌표 리스트를 받아 클러스터를 생성하는 함수
 * @param {*} coords
 */
function createCluster(roomList) {
  roomCluster = new kakao.maps.MarkerClusterer({
    map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
    averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
    minLevel: 1, // 클러스터 할 최소 지도 레벨
    gridSize: 60,
    minClusterSize: 1, // Number : 클러스터링 할 최소 마커 수 (default: 2)
    disableClickZoom: true,
    styles: [
      {
        width: "40px",
        height: "40px",
        background: "#3c5cff",
        color: "#fff",
        textAlign: "center",
        lineHeight: "40px",
        borderRadius: "50%",
        border: "1px solid #4c3aff",
        opacity: "0.85",
      },
      {
        width: "53px",
        height: "52px",
        background: "#3c5cff",
        color: "#fff",
        textAlign: "center",
        lineHeight: "54px",
        borderRadius: "50%",
        border: "1px solid #4c3aff",
        opacity: "0.85",
      },
    ],
    calculator: [10],
  });
  roomAndMarker = [];
  markers = roomList.map(function (room, i) {
    let position = room.item.random_location.split(",");
    let marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(position[0], position[1]),
    });
    roomAndMarker.push({ roomData: room, marker: marker });
    return marker;
  });

  roomCluster.setTexts((size) => {
    var text = "";

    if (size > 100) text = "100+";
    else text = size;

    return text;
  });
  roomCluster.addMarkers(markers);

  // * 생성된 클러스터에 적용하는 이벤트들
  // & clustered(클러스터 생성 완료 후) 이벤트가 바로 적용되지 않는 이유 :
  // &   클러스터가 생성된 후에 클러스터들에게 이벤트를 적용시킨다.
  // &   생성된 후에 clustered 이벤트를 적용시킨다.
  // &   따라서 처음 생성된 클러스터에는 clustered 이벤트가 적용되지 않는다.
  // &   그리고 생성된 클러스터는 지도가 확대/축소될때마다 clustered되며 이때마다 이벤트가 적용된다.

  // 처음 생성된 클러스터에 적용하는 이벤트 (clustered 이벤트핸들러와 내용은 같다.)
  roomCluster._clusters.forEach((cluster) => {
    let overlay = cluster.getClusterMarker().getContent();
    overlay.addEventListener("mouseover", function () {
      if (!this.classList.contains("cluster-over")) {
        this.classList.add("cluster-over");
      }
    });
    overlay.addEventListener("mouseout", function () {
      if (this.classList.contains("cluster-over")) {
        this.classList.remove("cluster-over");
      }
    });
  });

  kakao.maps.event.addListener(roomCluster, "clusterclick", function (cluster) {
    let roomList = cluster
      .getMarkers()
      .map(
        (marker) =>
          roomAndMarker.find((item) => marker === item.marker).roomData
      );

    createCardList(roomList);
  });

  kakao.maps.event.addListener(roomCluster, "clustered", function (clusters) {
    for (var i = 0; i < clusters.length; i++) {
      var cluster = clusters[i];
      var overlay = cluster.getClusterMarker().getContent();

      overlay.addEventListener("mouseover", function () {
        if (!this.classList.contains("cluster-over")) {
          this.classList.add("cluster-over");
        }
      });

      overlay.addEventListener("mouseout", function () {
        if (this.classList.contains("cluster-over")) {
          this.classList.remove("cluster-over");
        }
      });
    }
  });
}

// ^ 클러스터의 style(CSS)에 변화를 줘서 클러스터를 보이게, 안보이게 하는 함수
function displayRoomCluster(boolean) {
  let style = [];
  if (boolean) {
    style = [
      {
        width: "40px",
        height: "40px",
        background: "#3c5cff",
        color: "#fff",
        textAlign: "center",
        lineHeight: "40px",
        borderRadius: "50%",
        border: "1px solid #4c3aff",
        opacity: "0.85",
      },
      {
        width: "53px",
        height: "52px",
        background: "#3c5cff",
        color: "#fff",
        textAlign: "center",
        lineHeight: "54px",
        borderRadius: "50%",
        border: "1px solid #4c3aff",
        opacity: "0.85",
      },
    ];
  } else {
    style = [
      {
        display: "none",
      },
    ];
  }
  if (roomCluster != null) roomCluster.setStyles(style);
}

//* =============================== 지역 / 지하철 오버레이 관련 함수 ===============================
/**
 *^ 서울, 경기, 부산 등 지역정보를 보여주는 오버레이 생성
 * @param {*} local
 */
function createOverlay_local(local) {
  local.forEach((data) => {
    let content =
      data.id === "수도권"
        ? `<div class="customOverlay customOverlay--local customOverlay--capital" data-id="${data.id}" data-name="${data.name}" data-lat="${data.lat}" data-lng="${data.lng}">${data.name}</div>`
        : `<div class="customOverlay customOverlay--local" data-id="${data.id}" data-name="${data.name}" data-lat="${data.lat}" data-lng="${data.lng}">${data.name}</div>`;
    let customOverlay = new kakao.maps.CustomOverlay({
      map: map,
      content: content,
      clickable: true,
      position: new kakao.maps.LatLng(data.lat, data.lng),
      xAnchor: 0.5,
      yAnchor: 1,
      zIndex: 999999,
    });
    localOverlayList.push(customOverlay);
  });
  const overlayList = document.querySelectorAll(".customOverlay");

  overlayList.forEach((overlay) => {
    overlay.addEventListener("click", localOverlayClick);
  });
}

/**
 * ^ 모든 지하철역에 대한 overlay객체를 생성하고, 배열에 저장하는 함수.
 * ^ overlay 배열을 순회해서 setMap(map)/setMap(null)을 적용한다.
 * ^ 지도 레벨에따라 지도에 올려진다./삭제된다.
 */
async function createOverlay_subway_all() {
  let subwayList = await oneroom.getSubwayInfo_all();
  subwayList.forEach((data) => {
    let content = `<div class="customOverlay customOverlay--subway" data-id="${data.id}" data-name="${data.name}" data-lat="${data.lat}" data-lng="${data.lng}">${data.name}</div>`;

    let customOverlay = new kakao.maps.CustomOverlay({
      content: content,
      clickable: true,
      position: new kakao.maps.LatLng(data.lat, data.lng),
      xAnchor: 0.5,
      yAnchor: 1,
    });
    subwayOverlayList.push(customOverlay);
  });
}

/**
 * ^ 클릭한 지역오버레이를 중심으로 지도를 확대하는 이벤트 핸들러
 * @param {*} event 클릭한 오버레이 정보
 */
function localOverlayClick(event) {
  let overlay = event.target;
  map.setLevel(CRITERIA_MAP_LEVEL - 1);
  map.setCenter(
    new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng)
  );
}

/**
 * ^ 클릭한 지하철오버레이를 중심으로 지도를 확대하는 이벤트 핸들러
 * @param {*} event
 */
function subwayOverlayClick(event) {
  let overlay = event.target;

  // 방 클러스터가 있음을 알리는 상태
  roomClusterState = true;

  // 기존에 방 정보(마커)가 있다면 삭제
  if (roomCluster != null) roomCluster.clear();

  // 방 정보를 요청후 클러스터 생성
  getOneRoomCluster(overlay.dataset.name);

  // 지역, 지하철 오버레이를 전부 지도에서 지운다.
  localOverlayList.forEach((localOverlay) => localOverlay.setMap(null));
  subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(null));

  map.setLevel(5);
  map.setCenter(
    new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng)
  );
}

function overlaySetEvent() {
  const localOverlay = document.querySelectorAll(
    ".customOverlay.customOverlay--local"
  );
  localOverlay.forEach((overlay) => {
    console.log("count");
    overlay.addEventListener("click", localOverlayClick);
  });

  // 오버레이가 많을때 모든 오버레이를 선택할수 있게 지연을 시켰다.
  setTimeout(() => {
    const subwayOverlay = document.querySelectorAll(
      ".customOverlay.customOverlay--subway"
    );

    subwayOverlay.forEach((overlay) => {
      overlay.addEventListener("click", subwayOverlayClick);
    });
  }, 500);
}

function loading(boolean) {
  const loading = document.querySelector("#loading");
  if (boolean) loading.classList.add("active");
  else loading.classList.remove("active");
}

function getPyeong(size) {
  return Math.floor(Math.round(Number(size)) / 3);
}

function init() {
  createOverlay_subway_all();
  createOverlay_local(local);
  // setCardList();
}

init();
