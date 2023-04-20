import Oneroom from "../api/crawling_oneroom.js";
import filter from "./filter.js";
import { loading } from "./etc.js";
import { activeDetailBox, createRoomSection } from "./oneroom.js";
import { ableSortBtn, disableSortBtn } from "./sort.js";

/** 목차
 * 1. 전역변수
 * 2. 지역 / 지하철 오버레이
 * 3. 매물 클러스터
 */

const oneroom = new Oneroom();
const DEFAULT_MAP_LEVEL = 7;
const filterCategories = document.querySelectorAll(".filter__category");
const hyperLocal = filterCategories[2];
const markerList = [];
const hyperLocalMarkerList = [];
let infoWindow = null;

/**
 * 클러스터를 생성할때 마커와 방정보를 함께 매핑한 배열
 */
let roomAndMarker = null;

/**
 * filter 하기 전 원본 배열
 */
let originalRoomAndMarker = [];

// 지도 생성
const map = new kakao.maps.Map(document.getElementById("map"), {
  center: new kakao.maps.LatLng(37.53886742395844, 126.98678427911392), //필수 옵션이라서 아무 좌표를 줬습니다.
  level: 8,
  maxLevel: 12,
});

//* =============================== 지역 / 지하철 오버레이 관련 코드들 ===============================

/**
 * 생성된 클러스터 객체 : _clusters, _markers 등의 여러 정보를 가지고있다.
 */
let roomCluster = null;

/**
 * ! 확인
 * 지역 오버레이 배열
 */
const localOverlayList = [];

/**
 * ! 확인
 * 지하철 오버레이 배열
 */
const subwayOverlayList = [];

/**
 * roomCluster 존재여부를 확인하는 변수,
 * roomCluster는 promise데이터로 만들기때문에 지연되는 시간차를 막고자 따로 만들었다.
 */
let roomClusterState = false;

/**
 * ! 확인
 *^ 서울, 경기, 부산 등 지역정보를 보여주는 오버레이를 생성하고, 배열에 저장하는 함수
 *^ overlay 배열을 순회해서 setMap(map)/setMap(null)을 적용한다.
 * ^ 지도 레벨에따라 지도에 올려진다./삭제된다.
 * @param {*} localList [{id:대구광역시,name:대구,lat,lng},{}...]
 */
function createLocalOverlay() {
  /**
   * * id : id
   * * name : 오버레이에 보여질 이름
   * * lat, lng : 좌표
   */
  const localList = [
    { id: "강원도", name: "강원도", lat: "37.555837", lng: "128.209315" },
    { id: "충청남도", name: "충청남도", lat: "36.557229", lng: "126.779757" },
    { id: "광주광역시", name: "광주", lat: "35.126033", lng: "126.831302" },
    { id: "대구광역시", name: "대구", lat: "35.798838", lng: "128.583052" },
    { id: "대전광역시", name: "대전", lat: "36.321655", lng: "127.378953" },
    { id: "경상북도", name: "경상북도", lat: "36.248647", lng: "128.664734" },
    { id: "경상남도", name: "경상남도", lat: "35.259787", lng: "128.664734 " },
    { id: "부산광역시", name: "부산", lat: "35.198362", lng: "129.053922" },
    { id: "울산광역시", name: "울산", lat: "35.519301", lng: "129.239078" },
    { id: "수도권", name: "수도권", lat: "37.5642135", lng: "127.0016985" },
  ];

  localList.forEach((local) => {
    let content =
      local.id === "수도권"
        ? `<div class="customOverlay customOverlay--local customOverlay--capital" data-id="${local.id}" data-name="${local.name}" data-lat="${local.lat}" data-lng="${local.lng}">${local.name}</div>`
        : `<div class="customOverlay customOverlay--local" data-id="${local.id}" data-name="${local.name}" data-lat="${local.lat}" data-lng="${local.lng}">${local.name}</div>`;
    let customOverlay = new kakao.maps.CustomOverlay({
      map: map,
      content: content,
      clickable: true,
      position: new kakao.maps.LatLng(local.lat, local.lng),
      xAnchor: 0.5,
      yAnchor: 1,
    });
    localOverlayList.push(customOverlay);
  });
}

// ! 확인
function setRoomClusterState(boolean) {
  roomClusterState = boolean;
}

// ! 확인
function getRoomClusterState() {
  return roomClusterState;
}

/**
 * ! 확인
 * ^ 지역 오버레이를 지도에 표시한다. or 없앤다.
 * @param {*} boolean
 */
function displayLocalOverlay(boolean) {
  boolean
    ? localOverlayList.forEach((localOverlay) => localOverlay.setMap(map))
    : localOverlayList.forEach((localOverlay) => localOverlay.setMap(null));
}

/**
 * ! 확인
 * ^ 지하철 오버레이를 지도에 표시한다. or 없앤다.
 * @param {*} boolean
 */
function displaySubwayOverlay(boolean) {
  boolean
    ? subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(map))
    : subwayOverlayList.forEach((subwayOverlay) => subwayOverlay.setMap(null));
}

/**
 * ! 확인
 * ^ 모든 지하철역에 대한 overlay객체를 생성하고, 배열에 저장하는 함수.
 * ^ overlay 배열을 순회해서 setMap(map)/setMap(null)을 적용한다.
 * ^ 지도 레벨에따라 지도에 올려진다./삭제된다.
 */
async function createSubwayOverlay() {
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
 * ! 확인
 * ^ overlay(지역, 지하철)에 클릭이벤트를 등록하는 함수
 * - 드래그, 줌 등의 행위로 새 오버레이가 표시될때마다 이벤트를 등록해야 한다.
 */
function setEventOnOverlay() {
  // 이게 중첩해서 이벤트등록을 하고있어

  const localOverlay = document.querySelectorAll(
    ".customOverlay.customOverlay--local"
  );

  localOverlay.forEach((overlay) => {
    overlay.addEventListener("click", localOverlayClickHandler);
  });

  // 지하철 오버레이는 많아서 모든 오버레이를 선택할수 있게 살짝 지연시켰다.
  setTimeout(() => {
    const subwayOverlay = document.querySelectorAll(
      ".customOverlay.customOverlay--subway"
    );

    subwayOverlay.forEach((overlay) => {
      overlay.addEventListener("click", subwayOverlayClickHandler);
    });
  }, 500);
}

/**
 * ! 확인
 * setEventOnOverlay에서 사용되는 이벤트핸들러
 */
const localOverlayClickHandler = (event) => {
  let overlay = event.target;
  map.setLevel(DEFAULT_MAP_LEVEL - 1);
  map.setCenter(
    new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng)
  );
};

/**
 * ! 확인
 * setEventOnOverlay에서 사용되는 이벤트핸들러
 */
const subwayOverlayClickHandler = (event) => {
  let overlay = event.target;

  displayLocalOverlay(false);
  displaySubwayOverlay(false);

  // 방 클러스터가 있음을 알리는 상태
  setRoomClusterState(true);

  // 이미 방에 대한 마커가 있다면 삭제, 삭제하지 않으면 계속 중첩된다.

  if (roomCluster) {
    roomCluster.clear();
  }

  // 방 정보를 요청하여 방클러스터 생성
  createRoomCluster(overlay.dataset.name);

  // 새로운 지하철로 매물을 검색했으니 필터용 오리지널 방 정보를 초기화
  originalRoomAndMarker.length = 0;

  // 필터 버튼 활성화
  filter.ableFilterBtn();

  map.setLevel(5);
  map.setCenter(
    new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng)
  );
};

//* ============================== 매물 클러스터 관련 코드들 =================================

/**
 * ^ 좌표 리스트를 받아 클러스터를 생성하는 함수
 *
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

  /**
   * 클러스터에 담길 매물들의 지도상 마커
   */
  let markers = roomList.map(function (room, i) {
    let position = room.item.random_location.split(",");
    let marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(position[0], position[1]),
    });

    // 방 정보와 마커를 매핑
    roomAndMarker.push({ roomData: room, marker: marker });
    return marker;
  });

  // 새 지하철역을 클릭했을때 originalRoomAndMarker는 초기화된다.
  // 초기화된 original에 새 값을 저장
  if (originalRoomAndMarker.length === 0)
    originalRoomAndMarker = [...roomAndMarker];

  roomCluster.setTexts((size) => {
    let text = "";

    if (size > 100) text = "100+";
    else text = size;

    return text;
  });

  // 마커를 클러스터에 담는다. -> 이제 마커들은 클러스터기능이 적용된다.
  roomCluster.addMarkers(markers); // 클러스터 생성

  // 처음 생성된 클러스터의 엘리먼트들에 적용하는 css변화 이벤트 (clustered 이벤트핸들러와 기능은 같다.)
  roomCluster._clusters.forEach((cluster) => {
    let clusterElement = cluster.getClusterMarker().getContent();

    clusterElement.addEventListener("mouseover", function (e) {
      if (!this.classList.contains("cluster-over")) {
        this.classList.add("cluster-over");
      }
    });

    clusterElement.addEventListener("mouseout", function (e) {
      if (this.classList.contains("cluster-over")) {
        this.classList.remove("cluster-over");
      }
    });
  });

  // 처음 생성된 이후 zoomIn, out, 지도이동으로 생기는 클러스터의 엘리먼트들에게 적용
  // 매물 클러스터 생성후 줌아웃으로 사라졌다가 줌인으로 다시 생긴 경우 등에 적용된다.
  kakao.maps.event.addListener(roomCluster, "clustered", function (clusters) {
    for (let i = 0; i < clusters.length; i++) {
      let cluster = clusters[i];
      let clusterElement = cluster.getClusterMarker().getContent();

      clusterElement.addEventListener("mouseover", function () {
        if (!this.classList.contains("cluster-over")) {
          this.classList.add("cluster-over");
        }
      });

      clusterElement.addEventListener("mouseout", function () {
        if (this.classList.contains("cluster-over")) {
          this.classList.remove("cluster-over");
        }
      });
    }
  });

  kakao.maps.event.addListener(roomCluster, "clusterclick", function (cluster) {
    const sortBtns = document.querySelectorAll(".sort-btn");
    let clusterElement = cluster.getClusterMarker().getContent();

    // 매물 클러스터를 클릭한다 = 다른 매물클러스터를 눌렀다 or 현재 매물클러스터를 껐다. -> 디테일창을 비활성화 해야한다.
    activeDetailBox(false);

    // 클릭한 클러스터의 "cluster-click" 클래스 토글
    clusterElement.classList.toggle("cluster-click");

    // 나머지 클러스터의 "cluster-click" 클래스 삭제
    roomCluster._clusters.forEach((innerCluster) => {
      if (innerCluster === cluster) return;
      innerCluster
        .getClusterMarker()
        .getContent()
        .classList.remove("cluster-click");
    });

    // "cluster-click"가 있다면
    if (clusterElement.classList.contains("cluster-click")) {
      let roomList = cluster
        .getMarkers()
        .map(
          (marker) =>
            roomAndMarker.find((item) => marker === item.marker).roomData
        );

      createRoomSection(roomList);
      ableHyperLocalBtn();
      ableSortBtn();
    }
    // "cluster-click"가 없다면
    else {
      createRoomSection(null);
      disableHyperLocalBtn();
      disableSortBtn();
    }

    sortBtns.forEach((btn) => {
      const up = btn.querySelector(".fa-sort-up");
      const down = btn.querySelector(".fa-sort-down");
      btn.dataset.state = "basic";
      up.classList.add("active");
      down.classList.add("active");
    });
  });
}

function removeCluster() {
  if (roomCluster) roomCluster.clear();
}

/**
 * ! 확인
 * ^ 지하철 주변 방들의 좌표 리스트를 받아 클러스터를 생성하는 함수
 *
 * @param {*} coords
 */
async function createRoomCluster(subway) {
  loading(true);
  let roomList = await oneroom.getRoomData(subway); // 프로미스 배열을 반환
  loading(false);
  createCluster(roomList);
}

/**
 * ! 확인
 * ^ 클러스터의 CSS(setStyle())에 변화를 줘서 클러스터를 보이게, 안보이게 하는 함수
 * @param {*} boolean
 */
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
  // kakao 에서 제공하는 cluster style 적용 함수
  if (roomCluster) roomCluster.setStyles(style);
}

/**
 * ! 확인
 * ^ 세권 버튼을 클릭 가능한 상태로 만드는 함수
 */
function ableHyperLocalBtn() {
  hyperLocal.classList.remove("disable");
}
/**
 * ! 확인
 * ^ 세권 버튼을 클릭 불가능한 상태로 만드는 함수
 */
function disableHyperLocalBtn() {
  hyperLocal.classList.add("disable");
}

function getRoomCluster() {
  return roomCluster;
}

/**
 * ^ 장소 data를 받아 마커를 생성하고 이벤트를 적용하는 함수
 * @param {*} data
 */
function createMarker(data) {
  let address = data.address_name || null;
  // let roadAddress = data.road_address_name || null;
  let place = data.place_name || null;
  let category = data.category_group_name; //주소, 장소, 음식점-카페 등등
  let lat = data.y;
  let lng = data.x;

  let content = "";
  place === null
    ? (content = `<div class="infoWindow__content">
                    <div class="infoWindow__address infoWindow__address-data">${address}</div>
                  </div>`)
    : (content = `<div class="infoWindow__content">
                    <div class="infoWindow__place">${place}</div>
                    <div class="infoWindow__category">${category}</div>
                    <div class="infoWindow__address">${address}</div>
                  </div>`);

  let marker = new kakao.maps.Marker({
    map: map,
    position: new kakao.maps.LatLng(lat, lng),
  });

  let markerImage = new kakao.maps.MarkerImage(
    "../img/map/marker1.png",
    new kakao.maps.Size(30, 30),
    new kakao.maps.Point(15, 26)
  );
  marker.setImage(markerImage);

  kakao.maps.event.addListener(marker, "click", function () {
    if (infoWindow) infoWindow.close();
    infoWindow = new kakao.maps.InfoWindow({
      position: new kakao.maps.LatLng(lat, lng),
      content: content,
    });
    let infoWindowBox = infoWindow.a;
    let infoWindowArrow = infoWindow.a.firstElementChild;
    let infoWindowContentBox = infoWindow.Uf;
    infoWindowBox.classList.add("infoWindow-box");
    infoWindowArrow.classList.add("infoWindow__arrow");
    infoWindowContentBox.classList.add("infoWindow__content-box");
    infoWindow.open(map, marker);
  });

  let marekrObj = {
    marker: marker,
    info: data,
  };

  markerList.push(marekrObj);
}

/**
 * 세권 마커를 생성한다.
 * @param {*} data 마커에 대한 정보
 * @param {*} markerImageName 마커의 이미지 이름
 */
function createHyperLocalMarker(data, markerImageName) {
  console.log(data);
  let address = data.address_name || null;
  // let roadAddress = data.road_address_name || null;
  let place = data.place_name || null;
  let category = data.category_group_name; //주소, 장소, 음식점-카페 등등
  let lat = data.y;
  let lng = data.x;

  let content = "";
  place === null
    ? (content = `<div class="infoWindow__content">
                    <div class="infoWindow__address infoWindow__address-data">${address}</div>
                  </div>`)
    : (content = `<div class="infoWindow__content">
                    <div class="infoWindow__place">${place}</div>
                    <div class="infoWindow__category">${category}</div>
                    <div class="infoWindow__address">${address}</div>
                  </div>`);

  let marker = new kakao.maps.Marker({
    map: map,
    position: new kakao.maps.LatLng(lat, lng),
  });

  let markerImage = new kakao.maps.MarkerImage(
    `../img/map/marker_${markerImageName}.png`,
    new kakao.maps.Size(30, 30),
    new kakao.maps.Point(15, 26)
  );

  marker.setImage(markerImage);

  // marker를 받아서 click 이벤트를 등록하고
  //
  kakao.maps.event.addListener(marker, "click", function () {
    // console.log(infoWindow);
    if (infoWindow) infoWindow.close();
    infoWindow = new kakao.maps.InfoWindow({
      position: new kakao.maps.LatLng(lat, lng),
      content: content,
    });
    let infoWindowBox = infoWindow.a;
    let infoWindowArrow = infoWindow.a.firstElementChild;
    let infoWindowContentBox = infoWindow.Uf;
    infoWindowBox.classList.add("infoWindow-box");
    infoWindowArrow.classList.add("infoWindow__arrow");
    infoWindowContentBox.classList.add("infoWindow__content-box");
    infoWindow.open(map, marker);
  });

  let marekrObj = {
    marker: marker,
    info: data,
  };

  hyperLocalMarkerList.push(marekrObj);
}

function removeMarker(markerList) {
  markerList.forEach((obj) => {
    obj.marker.setMap(null);
  });
  markerList.length = 0;
}

/**
 * ^ 세권마커를 모두 삭제한다.
 */
function removeHyperLocalMarker() {
  hyperLocalMarkerList.forEach((obj) => {
    obj.marker.setMap(null);
  });
  hyperLocalMarkerList.length = 0;
}

/**
 * ^ 인포윈도우를 닫는다.
 */
function removeInfoWindow() {
  if (infoWindow) infoWindow.close();
}

kakao.maps.event.addListener(map, "click", function (mouseEvent) {
  console.log(map.getLevel());
  removeInfoWindow();
});

// 지도의 드래그가 끝났을때 화면에 보여지는 오버레이에 이벤트 등록
kakao.maps.event.addListener(map, "dragend", function () {
  setEventOnOverlay();
});

// 지도 레벨에 따라 로컬, 지하철, 방을 보여준다.
// 보여지는 오버레이에 클릭이벤트를 등록한다.
kakao.maps.event.addListener(map, "zoom_changed", function (mouseEvent) {
  // 5이하 : 매물, 6~8 : 지하철, 9이상 : 로컬
  // 지하철 오버레이를 띄워야할때
  if (5 < map.getLevel() && map.getLevel() < 8) {
    displayLocalOverlay(false);
    displaySubwayOverlay(true);

    displayRoomCluster(false);
    createRoomSection(null);
    filter.disableFilterBtn();
    disableHyperLocalBtn();
    disableSortBtn();
    activeDetailBox(false);
  }
  // 매물 클러스터를 띄워야 할때
  else if (map.getLevel() <= 5) {
    // console.log("줌이 바뀌었는데 방정보 있을때");
    if (getRoomClusterState()) {
      displayRoomCluster(true);
      createRoomSection(null);
      displayLocalOverlay(false);
      displaySubwayOverlay(false);
      filter.ableFilterBtn();
    }
    // console.log("줌이 바뀌었는데 방정보 없을때");
    else {
      displayLocalOverlay(false);
      displaySubwayOverlay(true);
      filter.disableFilterBtn();
    }
  }
  // 로컬 오버레이를 띄워야할때
  else {
    displayLocalOverlay(true);
    displaySubwayOverlay(false);
    createRoomSection(null);
    filter.disableFilterBtn();
    disableHyperLocalBtn();
    disableSortBtn();
  }

  setEventOnOverlay();
});

/**
 * 지도를 해당 좌표로 부드럽게 이동시킨다.
 * @param {*} lat
 * @param {*} lng
 */
function panTo(lat, lng) {
  map.panTo(new kakao.maps.LatLng(lat, lng));
}

function getOriginalRoomAndMarker() {
  return originalRoomAndMarker;
}

export default {
  map,
  createLocalOverlay,
  createSubwayOverlay,
  displayLocalOverlay,
  displaySubwayOverlay,
  getRoomClusterState,
  displayRoomCluster,
  disableHyperLocalBtn,
  setEventOnOverlay,
  getRoomCluster,
  createMarker,
  createHyperLocalMarker,
  removeMarker,
  removeInfoWindow,
  removeHyperLocalMarker,
  getOriginalRoomAndMarker,
  createRoomCluster,
  createCluster,
  removeCluster,
};
