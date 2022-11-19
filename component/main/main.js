import Oneroom from "./oneroom.js";
const CRITERIA_MAP_LEVEL = 7;
const oneroom = new Oneroom();
const filter = document.querySelectorAll(".filter__select");
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
// 1. 새 오버레이 생성
// 2. 지도확대 축소후 새로 생긴 오버레이
// 3. 지도 이동후 새로생긴 오버레이
//^ 지도의 드래그가 끝났을때 화면에 보여지는 오버레이에 이벤트 등록
kakao.maps.event.addListener(map, "dragend", function () {
  const overlayList = document.querySelectorAll(".customOverlay");
  overlayList.forEach((overlay) => {
    overlay.addEventListener("click", zoomIn_local);
  });
});

//^ 지도의 확대레벨이 변경될때 화면에 보여지는 오버레이에 이벤트 등록
//! 로컬에는 클릭시 지하철이 보일때까지 확대하는 이벤트핸들러
//! 지하철에는 클릭시 주변 매물정보를 클러스터 하는 이벤트 핸들러
kakao.maps.event.addListener(map, "zoom_changed", function (mouseEvent) {
  const localOverlay = document.querySelectorAll(
    ".customOverlay.customOverlay--local"
  );
  const subwayOverlay = document.querySelectorAll(
    ".customOverlay.customOverlay--subway"
  );
  localOverlay.forEach((overlay) => {
    overlay.addEventListener("click", zoomIn_local);
  });
});

//^ 지도의 확대레벨 5보다 클때 지하철 오버레이를 전부 삭제하고, 지역 오버레이를 보여준다.
//^ 클릭시 zoomIn_local 이벤트도 등록한다.
//^ 지도의 확대레벨이 5이하일때 지역 오버레이를 전부 삭제, 지하철 오버레이를 보여준다.
//^ 클릭시 zoomIn_subway 이벤트 등록
kakao.maps.event.addListener(map, "zoom_changed", function (mouseEvent) {
  const overlayList = document.querySelectorAll(".customOverlay");
  console.log(subwayOverlayList);
  // if (subwayOverlayList.length === 0) createOverlay_subway_all();
  if (map.getLevel() < CRITERIA_MAP_LEVEL) {
    localOverlayList.forEach((localOverlay) => localOverlay.setMap(null));
    subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(map));
  } else {
    localOverlayList.forEach((localOverlay) => localOverlay.setMap(map));
    subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(null));
  }
  overlayList.forEach((overlay) => {
    overlay.addEventListener("click", zoomIn_local);
  });
});

/**
 *^ 역 주변 매물의 위치를 클러스터로 나타낸다.
 */
async function getOneRoomCluster(subway) {
  if (map.getLevel() > CRITERIA_MAP_LEVEL) {
    let oneroomList = await getOneRoomData(subway); // 프로미스 배열이 있음, await 안쓰면 프로미스 안에 프로미스배열이 있음
    Promise.all(oneroomList).then((oneroomList) => {
      let coordList = [];
      oneroomList.forEach((oneroom) => {
        coordList.push(oneroom.item.random_location.split(","));
      });
      createCluster(coordList);
    });
  }
}
// getOneRoomCluster("군자역");

/**
 * ^좌표 리스트를 받아 클러스터를 생성하는 함수
 * @param {*} coords
 */
function createCluster(coords) {
  let clusterer = new kakao.maps.MarkerClusterer({
    map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
    averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
    minLevel: 3, // 클러스터 할 최소 지도 레벨
    gridSize: 60,
    minClusterSize: 2, // Number : 클러스터링 할 최소 마커 수 (default: 2)
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

  var markers = coords.map(function (position, i) {
    return new kakao.maps.Marker({
      position: new kakao.maps.LatLng(position[0], position[1]),
    });
  });

  clusterer.setTexts((size) => {
    var text = "";

    if (size > 100) text = "100+";
    else text = size;

    return text;
  });
  clusterer.addMarkers(markers);
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
    overlay.addEventListener("click", zoomIn_local);
  });
}

/**
 * ^클릭한 지점의 위치를 중심으로 지도를 확대하는 이벤트핸들러
 */
function zoomIn_local(event) {
  let overlay = event.target;
  // 1씩 낮추는 방법
  // map.setLevel(map.getLevel() - 1, {
  //   anchor: new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng),
  // });

  // 바로 지하철들 보이게 하는 방법
  map.setLevel(CRITERIA_MAP_LEVEL - 1, {
    anchor: new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng),
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

function init() {
  //지하철 오버레이 생성 (지도레벨 5이하에서 보임)
  createOverlay_subway_all();
  //지역 오버레이 생성 (지도레벨 6이상에서 보임)
  createOverlay_local(local);
}

init();
