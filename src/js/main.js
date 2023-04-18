/**
 * 발견된 문제점들
 * ! 유형.금액 필터의 초기화 버튼 미적용
 * ! 월세 정렬 기능 미적용 -> 전세랑 월세가 섞여있으니 금액으로 퉁치자
 */

import Oneroom from "../module/crawling_oneroom.js";
import kakaoMap from "../module/kakaoMap.js";
import filter from "../module/filter.js";
import { activeDetailBox, createRoomSection } from "../module/oneroom.js";
import { ableSortBtn, disableSortBtn } from "../module/sort.js";
import kakaoSearch from "../module/kakaoSearch.js";

const search = document.querySelector(".search");
const searchInput = search.querySelector(".search__input");
const searchList = search.querySelector(".search-list");
const nav = document.querySelector(".nav");
const navbox = document.querySelector(".nav__item-box");
const navItems = nav.querySelectorAll(".nav__item");

const oneroom = new Oneroom();

/**
 * 검색 결과 정보와 마커를 담은 배열
 */
const markerList = [];
/**
 * 마커를 클릭시 열리는 창
 */
let infoWindow = null;

/**
 * !설명
 * 지역, 지하철은 customOverlay로 만들었다. 방은 cluster로 만들었다.
 *
 * !지도 이용 순서
 * 1. init()함수로 지역, 지하철 오버레이를 생성한다.
 * 2. 지하철 오버레이를 클릭하면 방 클러스터가 생성된다.
 * 3. 방을 리스트로 보여주며, 모든 방에 대해 필터적용, 각 방에 대한 세권찾기
 *
 *
 * 역세권 거리
 * 반경 250m, 500m, 1km
 */

/**
 * 로컬과 지하철 클러스터를 먼저 보여줘야해
 */

const map = kakaoMap.map;

function getUserLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject); // success, error
  });
}

//* ============================== 방 정보, 방 클러스터 관련 코드들 =================================
//* ============================================== 검색 기능 관련 코드들 ========================================================

/**
 * ^ up key에 대한 이벤트 핸들러, 자동완성 리스트에서 위쪽으로 한칸씩 이동한다.
 */
function upKey() {
  const searchListItem = document.querySelectorAll(".search-list__item");

  let current; // active인 item

  // active가 존재하는지 체크 후 존재한다면 current = active인 item
  searchListItem.forEach((item) => {
    if (item.classList.contains("active")) current = item;
  });

  // current가 없으면 마지막 item이 current
  if (!current) {
    current = searchListItem[searchListItem.length - 1];
    current.classList.add("active");
    searchInput.value = current.innerText;
    return;
  }

  current.classList.remove("active");

  // current가 있고, 이전 item이 없다면 마지막 item이 current가 된다.
  if (!current.previousElementSibling) {
    current = searchListItem[searchListItem.length - 1];
    current.classList.add("active");
    searchInput.value = current.innerText;
    return;
  }

  // current가 있고, 이전 item이 있다면 이전 item이 current가 된다.
  current = current.previousElementSibling;
  current.classList.add("active");
  searchInput.value = current.innerText;
}

/**
 * ^ down key에 대한 이벤트 핸들러, 자동완성 리스트에서 아래쪽으로 한칸씩 이동한다.
 */
function downKey() {
  const searchListItem = document.querySelectorAll(".search-list__item");

  let current;
  searchListItem.forEach((item) => {
    if (item.classList.contains("active")) current = item;
  });

  if (!current) {
    current = searchListItem[0];
    current.classList.add("active");
    searchInput.value = current.innerText;
    return;
  }

  current.classList.remove("active");

  if (!current.nextElementSibling) {
    current = searchListItem[0];
    current.classList.add("active");
    searchInput.value = current.innerText;
    return;
  }

  current = current.nextElementSibling;
  current.classList.add("active");
  searchInput.value = current.innerText;
}

/**
 * ^ enter key에 대한 이벤트 핸들러, 입력된 값으로 검색을 한다.
 */
function enterKey() {
  const lat = map.getCenter().Ma;
  const lng = map.getCenter().La;

  if (!searchInput.value) return;

  kakaoSearch.search(searchInput.value, lat, lng).then((data) => {
    const addressSearchData = data[0];
    const keywordSearchData = data[1];

    // 주소검색 결과가 있다면 주소검색 결과만 다룬다.
    if (addressSearchData.length !== 0) {
      removeMarker();
      kakaoMap.removeInfoWindow();
      addressSearchData.forEach((data) => {
        kakaoMap.createMarker(data);
      });
    }
    // 키워드검색 결과만 있다면 키워드검색 결과만 다룬다.
    else if (addressSearchData.length === 0 && keywordSearchData.length !== 0) {
      kakaoMap.removeMarker();
      kakaoMap.removeInfoWindow();
      keywordSearchData.forEach((data) => {
        kakaoMap.createMarker(data);
      });
    }
    // 주소데이터, 키워드데이터 둘다 없다면
    else if (addressSearchData.length === 0 && keywordSearchData.length === 0) {
      alert("검색 결과가 없습니다.");
    }
  });
  displaySearchList(false);
}

/**
 * ^ 자동완성 결과 창을 활성화, 비활성화 한다.
 * @param {*} isTrue
 */
function displaySearchList(isTrue) {
  if (isTrue) {
    searchList.classList.add("active");
  } else {
    searchList.classList.remove("active");
  }
}

/**
 * ^ 검색리스트의 자동완성단어를 세팅하는 함수
 * @param {*} addressData [주소명,주소명...]
 * @param {*} keywordData [장소명,장소명...]
 * @returns
 */
function setAutoComplete(addressData, keywordData) {
  let element = "";

  //자동완성 데이터가 없다면 검색리스트 창을 닫는다.
  if (addressData.length === 0 && keywordData.length === 0) {
    displaySearchList(false);
    return;
  }

  while (searchList.firstChild) {
    searchList.removeChild(searchList.firstChild);
  }

  addressData.forEach((data, index) => {
    if (index >= 5) return;
    element = `<div class="search-list__item">${data}</div>`;
    searchList.insertAdjacentHTML("beforeend", element);
  });

  keywordData.forEach((data, index) => {
    element = `<div class="search-list__item">${data}</div>`;
    searchList.insertAdjacentHTML("beforeend", element);
  });

  // 만들어진 자동완성 단어들에게 이벤트 등록
  const searchListItem = document.querySelectorAll(".search-list__item");
  searchListItem.forEach((item) => {
    // 클릭시 검색
    item.addEventListener("click", (e) => {
      let text = e.currentTarget.innerText;

      const lat = map.getCenter().Ma;
      const lng = map.getCenter().La;

      kakaoSearch.search(text, lat, lng).then((data) => {
        const addressSearchData = data[0];
        const keywordSearchData = data[1];

        // 주소검색 결과가 있다면 주소검색 결과만 다룬다.
        if (addressSearchData.length !== 0) {
          kakaoMap.removeMarker();
          kakaoMap.removeInfoWindow();
          addressSearchData.forEach((data) => {
            kakaoMap.createMarker(data);
          });
        }
        // 키워드검색 결과만 있다면 키워드검색 결과만 다룬다.
        else if (
          addressSearchData.length === 0 &&
          keywordSearchData.length !== 0
        ) {
          kakaoMap.removeMarker();
          kakaoMap.removeInfoWindow();
          keywordSearchData.forEach((data) => {
            kakaoMap.createMarker(data);
          });
        }
        // 주소데이터, 키워드데이터 둘다 없다면
        else if (
          addressSearchData.length === 0 &&
          keywordSearchData.length === 0
        ) {
          alert("검색 결과가 없습니다.");
        }
      });
      displaySearchList(false);
    });
  });
}

// /**
//  * ^ 장소 data를 받아 마커를 생성하고 이벤트를 적용하는 함수
//  * @param {*} data
//  */
// function createMarker(data) {
//   let address = data.address_name || null;
//   // let roadAddress = data.road_address_name || null;
//   let place = data.place_name || null;
//   let category = data.category_group_name; //주소, 장소, 음식점-카페 등등
//   let lat = data.y;
//   let lng = data.x;

//   let content = "";
//   place === null
//     ? (content = `<div class="infoWindow__content">
//                     <div class="infoWindow__address infoWindow__address-data">${address}</div>
//                   </div>`)
//     : (content = `<div class="infoWindow__content">
//                     <div class="infoWindow__place">${place}</div>
//                     <div class="infoWindow__category">${category}</div>
//                     <div class="infoWindow__address">${address}</div>
//                   </div>`);

//   let marker = new kakao.maps.Marker({
//     map: map,
//     position: new kakao.maps.LatLng(lat, lng),
//   });

//   let markerImage = new kakao.maps.MarkerImage(
//     "../img/map/marker1.png",
//     new kakao.maps.Size(30, 30),
//     new kakao.maps.Point(15, 26)
//   );
//   marker.setImage(markerImage);

//   kakao.maps.event.addListener(marker, "click", function () {
//     if (infoWindow) infoWindow.close();
//     infoWindow = new kakao.maps.InfoWindow({
//       position: new kakao.maps.LatLng(lat, lng),
//       content: content,
//     });
//     let infoWindowBox = infoWindow.a;
//     let infoWindowArrow = infoWindow.a.firstElementChild;
//     let infoWindowContentBox = infoWindow.Uf;
//     infoWindowBox.classList.add("infoWindow-box");
//     infoWindowArrow.classList.add("infoWindow__arrow");
//     infoWindowContentBox.classList.add("infoWindow__content-box");
//     infoWindow.open(map, marker);
//   });

//   let marekrObj = {
//     marker: marker,
//     info: data,
//   };

//   markerList.push(marekrObj);
// }

// /**
//  * ^ 마커를 모두 삭제한다.
//  */
// function removeMarker() {
//   markerList.forEach((obj) => {
//     obj.marker.setMap(null);
//   });
//   markerList.length = 0;
// }

// 검색창을 클릭하면 검색창(search)에 active를 주고, searchInput에 focus를 준다.
search.addEventListener("click", (e) => {
  search.classList.add("active");
  searchInput.focus();
});

// search 관련 element 외의 것들을 클릭시 search의 active가 사라지는 이벤트
document.addEventListener("click", (e) => {
  if (
    e.target !== search &&
    e.target !== searchInput &&
    e.target !== searchList
  ) {
    search.classList.remove("active");
    searchList.classList.remove("active");
  }
});

/**
 * 검색창에 위, 아래, 엔터 각각의 함수를 이벤트로 등록한다.
 * 검색창에 값이 입력되면 검색창 아래에 리스트를 만들고 자동완성단어를 세팅한다.
 */
searchInput.addEventListener("keyup", (e) => {
  // 엔터, 방향키 입력시
  if (e.keyCode === 13) {
    enterKey();
    return;
  } else if (e.keyCode === 38) {
    if (searchList.classList.contains("active")) upKey();
    return;
  } else if (e.keyCode === 40) {
    if (searchList.classList.contains("active")) downKey();
    return;
  } else if (e.isComposing === false) return; //엔터키 중복입력을 막는다.

  // 그 외 입력시

  displaySearchList(true);

  kakaoSearch.search_autoComplete(searchInput.value).then((data) => {
    // 주소명, 장소명만 뽑아 자동완성을 세팅한다.

    const addressSearchData = data[0].map((item) => item.address_name);
    const keywordSearchData = data[1];
    setAutoComplete(addressSearchData, keywordSearchData);
  });
});

searchInput.addEventListener("input", (e) => {
  if (searchInput.value === "") {
    // 검색어를 지우다가 value === "" 이 됐을때, 이코드는 input에 적용해야 제대로 작동한다.
    displaySearchList(false);
    return;
  }
});

searchInput.addEventListener("keydown", (e) => {
  // 위,아래 입력시 커서가 이동하는걸 막음
  if (e.keyCode === 38 || e.keyCode === 40) e.preventDefault();
});

//* ========================================== NAV 관련 코드들

navItems.forEach((item, index) => {
  item.addEventListener("click", (e) => {
    for (let i = 0; i < navItems.length; i++) {
      if (index === i) navItems[i].classList.add("active");
      else navItems[i].classList.remove("active");

      /**
       * 클릭한 item의 인덱스랑 값이 같은 navItem[i]에는 active 추가
       * 나머지는 active 제거
       */
    }
  });
});

//* ========================================== kakao Map 관련 코드들 ================================================

/**
 * ^ 프로그램 시작시 실행되는 초기화 함수
 * ^ 처음부터 실행되어야할 함수들을 모았다.
 */
function init() {
  createRoomSection(null);
  kakaoMap.createLocalOverlay();
  kakaoMap.createSubwayOverlay();
  filter.createFilterOptionContent_price("전체");
  getUserLocation().then((data) => {
    map.setCenter(
      new kakao.maps.LatLng(data.coords.latitude, data.coords.longitude)
    );
    map.setLevel(6);
    setTimeout(() => {
      kakaoMap.displayLocalOverlay(false);
      kakaoMap.displaySubwayOverlay(true);
    }, 200);
  });
}

init();

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

function removeCluster() {
  if (roomCluster) roomCluster.clear();
}
