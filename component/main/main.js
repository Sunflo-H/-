// import { getOneRoomData } from "./oneroom.js";
import Oneroom from "./oneroom.js";

const filter = document.querySelectorAll(".filter__select");

const local = [
  { name: "서울특별시", lat: "37.5642135", lng: "127.0016985" },
  { name: "경기도", lat: "37.567167", lng: "127.190292" },
  { name: "강원도", lat: "37.555837", lng: "128.209315" },
  { name: "충청남도", lat: "36.557229", lng: "126.779757" },
  { name: "인청광역시", lat: "37.469221", lng: "126.573234" },
  { name: "광주광역시", lat: "35.126033", lng: "126.831302" },
  { name: "대구광역시", lat: "35.798838", lng: "128.583052" },
  { name: "대전광역시", lat: "36.321655", lng: "127.378953" },
  { name: "경상북도", lat: "36.248647", lng: "128.664734" },
  { name: "경상남도", lat: "35.259787", lng: "128.664734 " },
  { name: "부산광역시", lat: "35.198362", lng: "129.053922" },
  { name: "울산광역시", lat: "35.519301", lng: "129.239078" },
];

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

// console.log(filter);
// const size = filter;
// const sizeSelect = size.querySelector(".filter__select");
// const sizeOption = size.querySelector(".filter__option-table");
// const sizeOptionItem = size.querySelectorAll(".filter__option");

const map = new kakao.maps.Map(document.getElementById("map"), {
  center: new kakao.maps.LatLng(37.53886742395844, 126.98678427911392),
  level: 8, // 지도의 확대 레벨
  maxLevel: 11,
});

kakao.maps.event.addListener(map, "click", function (mouseEvent) {
  console.log(mouseEvent.latLng); // true
  console.log(map.getLevel());
});

const oneroom = new Oneroom();

// createCluster_팔도(local);
// 마우스 휠에 따라 함수 실행?
// 지도 렙에 따라 함수 실행?
// 지도 렙은 마우스 휠에 따라 바뀌어 => 지도 렙 감지 or 마우스 휠 감지
/**
 *^ 역 주변 매물의 위치를 클러스터로 나타낸다.
 */
async function getOneRoomCluster(subway) {
  if (map.getLevel() > 6) {
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
 * 좌표 리스트를 받아 클러스터를 생성
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
 * 좌표 리스트를 받아 클러스터를 생성
 * @param {*} local {지역명, lat, lng}
 */
function createCluster_팔도(local) {
  let clusterer = new kakao.maps.MarkerClusterer({
    map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
    averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
    minLevel: 3, // 클러스터 할 최소 지도 레벨
    gridSize: 0,
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

  var markers = local.map(function (data, i) {
    return new kakao.maps.Marker({
      position: new kakao.maps.LatLng(data.lat, data.lng),
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

function create팔도(local) {
  let list = [];
  local.forEach((data) => {
    let customOverlay = new kakao.maps.CustomOverlay({
      map: map,
      content: `<div class="customOverlay" data-name="${data.name}" data-lat="${data.lat}" data-lng="${data.lng}">${data.name}</div>`,
      clickable: true,
      position: new kakao.maps.LatLng(data.lat, data.lng),
      xAnchor: 0.5,
      yAnchor: 1,
      zIndex: 999999,
    });
    list.push(customOverlay);
  });
  const overlayList = document.querySelectorAll(".customOverlay");

  overlayList.forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      map.setLevel(map.getLevel() - 2, {
        anchor: new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng),
      });
    });
  });
}

create팔도(local);

window.addEventListener("wheel", (e) => {
  const overlayList = document.querySelectorAll(".customOverlay");

  overlayList.forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      map.setLevel(map.getLevel() - 2, {
        anchor: new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng),
      });
    });
  });
});

// 지도를 움직일때도 적용해야돼
