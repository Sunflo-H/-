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
let markers = null;
// const local = [
//   [37.5642135, 127.0016985],
//   [37.567167, 127.190292],
//   [37.555837, 128.209315],
//   [36.557229, 126.779757],
//   [37.469221, 126.573234],
//   [35.126033, 126.831302],
//   [35.798838, 128.583052],
//   [36.321655, 127.378953],
//   [36.248647, 128.664734],
//   [35.259787, 128.664734],
//   [35.198362, 129.053922],
//   [35.519301, 129.239078],
// ];

// 방 클러스터가 띄워져 있는 상태에서 어떻게 다시 역 오버레이 상태로 갈것인가?
// 방법1. 버튼을 만든다. (이전 버튼?)
// 방법2. 지도레벨 축소한다.

// 지도 생성
const map = new kakao.maps.Map(document.getElementById("map"), {
  center: new kakao.maps.LatLng(37.53886742395844, 126.98678427911392),
  level: 8,
  maxLevel: 11,
});

kakao.maps.event.addListener(map, "click", function (mouseEvent) {
  console.log(mouseEvent.latLng);
  console.log(map.getLevel());
});

// ! 오버레이에 이벤트를 등록해야하는 상황
// !1.에서 처음부터 생성.. 사용자 위치를 기준으로 지도레벨 확대해서 지하철부터 보여줄까???????
// 1. 새 오버레이 생성 (로컬의 경우 처음부터 생성되었기때문에 이때 적용함, subway랑 매물은 아님)
// 2. 지도확대 축소후 새로 생긴 오버레이
// 3. 지도 이동후 새로생긴 오버레이
//^ 지도의 드래그가 끝났을때 화면에 보여지는 오버레이에 이벤트 등록
kakao.maps.event.addListener(map, "dragend", function () {
  overlaySetEvent();
});

//^ 지도의 확대레벨 5보다 클때 지하철 오버레이를 전부 삭제하고, 지역 오버레이를 보여준다.
//^ 클릭시 localOverlayClick 이벤트도 등록한다.
//^ 지도의 확대레벨이 5이하일때 지역 오버레이를 전부 삭제, 지하철 오버레이를 보여준다.
//^ 클릭시 zoomIn_subway 이벤트 등록

/**
 * 지도 레벨에 따라 지역, 지하철, 매물을 보여준다.
 * 보여지는 오버레이에 클릭이벤트를 등록한다.
 */
kakao.maps.event.addListener(map, "zoom_changed", function (mouseEvent) {
  // 지도 레벨에 따라 오버레이를 지도에 띄운다.

  // 5이하 : 매물, 6~8 : 지하철, 9이상 : 지역
  if (5 < map.getLevel() && map.getLevel() < 8) {
    localOverlayList.forEach((localOverlay) => localOverlay.setMap(null));
    subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(map));
    let style = [
      {
        display: "none",
      },
    ];
    if (roomCluster != null) roomCluster.setStyles(style);
  } else if (map.getLevel() <= 5) {
    if (roomClusterState) {
      console.log("줌이 바뀌었는데 방정보 있을때");
      if (roomCluster != null) {
        let style = [
          {
            display: "block",
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
        roomCluster.setStyles(style);
      }

      localOverlayList.forEach((localOverlay) => localOverlay.setMap(null));
      subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(null));
    } else {
      console.log("줌이 바뀌었는데 방정보 없을때");
      localOverlayList.forEach((localOverlay) => localOverlay.setMap(null));
      subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(map));
    }
  } else {
    localOverlayList.forEach((localOverlay) => localOverlay.setMap(map));
    subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(null));
  }

  // 띄운 오버레이에 이벤트를 등록한다.
  setTimeout(() => {
    overlaySetEvent();
  }, 1000);
});

/**
 *^ 역 주변 매물의 위치를 클러스터로 나타낸다.
 */
async function getOneRoomCluster(subway) {
  let oneroomList = await oneroom.getRoomData(subway); // 프로미스 배열이 있음, await 안쓰면 프로미스 안에 프로미스배열이 있음
  loading(true);
  Promise.all(oneroomList).then((oneroomList) => {
    createCluster(oneroomList);
    loading(false);
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
    styles: [
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
  });

  markers = roomList.map(function (room, i) {
    let position = room.item.random_location.split(",");
    return new kakao.maps.Marker({
      position: new kakao.maps.LatLng(position[0], position[1]),
    });
  });

  roomCluster.setTexts((size) => {
    var text = "";

    if (size > 100) text = "100+";
    else text = size;

    return text;
  });
  roomCluster.addMarkers(markers);
  // roomClusterList.push(oneroom);

  // 클러스터를 맵에서 제거할 방법을 찾아보자
}

/**
 * 지도의 레벨이 5보다 클때 서울, 경기 등 지역정보를 보여주는 오버레이 생성
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
 * 모든 지하철 역에 대한 overlay를 배열에 저장하고, 지도에 띄운다.
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
 * ^클릭한 지역의 위치를 중심으로 지도를 확대하는 이벤트핸들러
 * @param {*} event
 */
function localOverlayClick(event) {
  let overlay = event.target;
  // 1씩 낮추는 방법
  // map.setLevel(map.getLevel() - 1, {
  //   anchor: new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng),
  // });

  // 바로 지하철들 보이게 하는 방법
  map.setLevel(CRITERIA_MAP_LEVEL - 1);

  map.setCenter(
    new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng)
  );
}

/**
 * ^ 클릭한 지하철의 위치를 중심으로 지도를 확대하는 이벤트 핸들러
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
  // 오버레이가 많을때 모든 오버레이가 선택이 안되는 경우를 위한 setTimeout
  const localOverlay = document.querySelectorAll(
    ".customOverlay.customOverlay--local"
  );

  const subwayOverlay = document.querySelectorAll(
    ".customOverlay.customOverlay--subway"
  );

  localOverlay.forEach((overlay) => {
    overlay.addEventListener("click", localOverlayClick);
  });
  subwayOverlay.forEach((overlay) => {
    overlay.addEventListener("click", subwayOverlayClick);
  });
}

function loading(boolean) {
  const loading = document.querySelector("#loading");
  if (boolean) loading.classList.add("active");
  else loading.classList.remove("active");
}

function init() {
  //지하철 오버레이 생성 (CRITERIA_MAP_LEVEL 미만에서 보임)
  createOverlay_subway_all();
  //지역 오버레이 생성 (CRITERIA_MAP_LEVEL 이상에서 보임)
  createOverlay_local(local);
}

init();
