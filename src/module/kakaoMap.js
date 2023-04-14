import Oneroom from "./oneroomModule.js";
import filter from "./filter.js";
import etc from "./etc.js";

const oneroom = new Oneroom();
const DEFAULT_MAP_LEVEL = 7;

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

  roomCluster.addMarkers(markers); // 클러스터 생성

  // 처음 생성된 클러스터의 엘리먼트들에 적용하는 css변화 이벤트 (clustered 이벤트핸들러와 기능은 같다.)
  roomCluster._clusters.forEach((cluster) => {
    let overlay = cluster.getClusterMarker().getContent();

    overlay.addEventListener("mouseover", function (e) {
      if (!this.classList.contains("cluster-over")) {
        this.classList.add("cluster-over");
      }
    });

    overlay.addEventListener("mouseout", function (e) {
      if (this.classList.contains("cluster-over")) {
        this.classList.remove("cluster-over");
      }
    });
  });

  // 처음 생성된 이후 zoomIn, out, 지도이동으로 생기는 클러스터의 엘리먼트들에게 적용
  kakao.maps.event.addListener(roomCluster, "clustered", function (clusters) {
    for (let i = 0; i < clusters.length; i++) {
      let cluster = clusters[i];
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
    }
  });

  kakao.maps.event.addListener(roomCluster, "clusterclick", function (cluster) {
    let overlay = cluster.getClusterMarker().getContent();

    // 클릭한 클러스터의 "cluster-click" 클래스 토글
    overlay.classList.toggle("cluster-click");

    // 나머지 클러스터의 "cluster-click" 클래스 삭제
    roomCluster._clusters.forEach((innerCluster) => {
      if (innerCluster === cluster) return;
      innerCluster
        .getClusterMarker()
        .getContent()
        .classList.remove("cluster-click");
    });

    // "cluster-click"가 있다면
    if (overlay.classList.contains("cluster-click")) {
      let roomList = cluster
        .getMarkers()
        .map(
          (marker) =>
            roomAndMarker.find((item) => marker === item.marker).roomData
        );
      createCardList(roomList);
      ableHyperLocalBtn();
      ableSortBtn();
    }
    // "cluster-click"가 없다면
    else {
      createCardList(null);
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

//* =============================== 지역 / 지하철 오버레이 관련 코드들 ===============================

/**
 * 생성된 클러스터 객체 : _clusters, _markers 등의 여러 정보를 가지고있다.
 */
let roomCluster = null;

/**
 * 지역 오버레이 배열
 * * 지역 오버레이를 '보여질때', '안보여질때'를 적용하기위해 사용한다.
 */
const localOverlayList = [];

/**
 * 지하철 오버레이 배열
 * * 지하철 오버레이를 '보여질때', '안보여질때'를 적용하기위해 사용한다.
 */
const subwayOverlayList = [];

/**
 * roomCluster 존재여부를 확인하는 변수,
 * roomCluster는 promise데이터로 만들기때문에 지연되는 시간차를 막고자 따로 만들었다.
 */
let roomClusterState = false;

/**
 *^ 서울, 경기, 부산 등 지역정보를 보여주는 오버레이를 생성하고, 배열에 저장하는 함수
 *^ overlay 배열을 순회해서 setMap(map)/setMap(null)을 적용한다.
 * ^ 지도 레벨에따라 지도에 올려진다./삭제된다.
 * @param {*} local [{id:대구광역시,name:대구,lat,lng},{}...]
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
    });
    localOverlayList.push(customOverlay);
  });

  const overlayList = document.querySelectorAll(".customOverlay");

  overlayList.forEach((overlay) => {
    overlay.addEventListener("click", localOverlayClickHandler);
  });
}

/**
 * ^ 클릭한 지역오버레이를 중심으로 지도를 확대하는 이벤트 핸들러
 * @param {*} event 클릭한 오버레이 정보
 */
function localOverlayClickHandler(event) {
  let overlay = event.target;
  map.setLevel(DEFAULT_MAP_LEVEL - 1);
  map.setCenter(
    new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng)
  );
}

/**
 * ^ overlay(지역, 지하철)에 클릭이벤트를 등록하는 함수
 */
function setEventOnOverlay() {
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
 * ^ 지하철 오버레이를 클릭시 발생하는 기능들에 대한 핸들러
 *
 * @param {*} event
 */
function subwayOverlayClickHandler(event) {
  console.log("클릭 핸들러 작동");
  let overlay = event.target;

  displayLocalOverlay(false);
  displaySubwayOverlay(false);

  // 방 클러스터가 있음을 알리는 상태
  setRoomClusterState(true);

  // 이미 방에 대한 마커가 있다면 삭제, 삭제하지 않으면 계속 중첩된다.
  removeRoomCluster();

  // 방 정보를 요청하여 방클러스터 생성
  createOneRoomCluster(overlay.dataset.name);

  // 새로운 지하철로 매물을 검색했으니 필터용 오리지널 방 정보를 초기화
  originalRoomAndMarker.length = 0;

  // 필터 버튼 활성화
  filter.ableFilterBtn();

  map.setLevel(5);
  map.setCenter(
    new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng)
  );
}

function setRoomClusterState(boolean) {
  roomClusterState = boolean;
}

function getRoomClusterState() {
  return roomClusterState;
}

function removeRoomCluster() {
  if (roomCluster) roomCluster.clear();
}

/**
 * ^ 지역 오버레이를 나타낸다.
 */
function displayLocalOverlay(boolean) {
  boolean
    ? localOverlayList.forEach((localOverlay) => localOverlay.setMap(map))
    : localOverlayList.forEach((localOverlay) => localOverlay.setMap(null));
}

/**
 * ^ 지하철 오버레이를 나타낸다.
 */
function displaySubwayOverlay(boolean) {
  boolean
    ? subwayOverlayList.forEach((localOverlay) => localOverlay.setMap(map))
    : subwayOverlayList.forEach((localOverlay) => localOverlay.setMap(null));
}

/**
 * ^ 모든 지하철역에 대한 overlay객체를 생성하고, 배열에 저장하는 함수.
 * ^ overlay 배열을 순회해서 setMap(map)/setMap(null)을 적용한다.
 * ^ 지도 레벨에따라 지도에 올려진다./삭제된다.
 */
async function createOverlay_subway() {
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

//* ============================== 방 정보, 방 클러스터 관련 코드들 =================================
/**
 *
 * ^ 역 주변 방정보를 요청하여 클러스터를 생성한다..
 */
async function createOneRoomCluster(subway) {
  etc.loading(true);
  let oneroomList = await oneroom.getRoomData(subway); // 프로미스 배열을 반환
  createCluster(oneroomList);
  etc.loading(false);
  // Promise.all(oneroomList).then((oneroomList) => {
  //   console.log(oneroomList);
  //   createCluster(oneroomList);
  //   etc.loading(false);
  // });
}

/**
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
  // kakao 에서 제공하는 cluster style 변경 함수
  if (roomCluster) roomCluster.setStyles(style);
}

export default {
  map,
  createOverlay_local,
  displayLocalOverlay,
  displaySubwayOverlay,
  createOverlay_subway,
  setEventOnOverlay,
  roomCluster,
  getRoomClusterState,
  displayRoomCluster,
};
