/**
 * 발견된 문제점들
 * ! 유형.금액 필터의 초기화 버튼 미적용
 * ! 월세 정렬 기능 미적용 -> 전세랑 월세가 섞여있으니 금액으로 퉁치자
 */

import Oneroom from "../module/crawling_oneroom.js";
import kakaoMap from "../module/kakaoMap.js";
import filter from "../module/filter.js";
import createRoomSection from "../module/oneroom.js";
import { ableSortBtn, disableSortBtn } from "../module/sort.js";
import kakaoSearch from "../module/kakaoSearch2.js";

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
 * 세권의 범위를 표현하는데 사용하는 원의 배열
 */
const circleList = [];

/**
 * 세권 마커정보 배열
 */
const hyperLocalMarkerList = [];

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
      removeInfoWindow();
      addressSearchData.forEach((data) => {
        createMarker(data);
      });
    }
    // 키워드검색 결과만 있다면 키워드검색 결과만 다룬다.
    else if (addressSearchData.length === 0 && keywordSearchData.length !== 0) {
      removeMarker();
      removeInfoWindow();
      keywordSearchData.forEach((data) => {
        createMarker(data);
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
          removeMarker();
          removeInfoWindow();
          addressSearchData.forEach((data) => {
            createMarker(data);
          });
        }
        // 키워드검색 결과만 있다면 키워드검색 결과만 다룬다.
        else if (
          addressSearchData.length === 0 &&
          keywordSearchData.length !== 0
        ) {
          removeMarker();
          removeInfoWindow();
          keywordSearchData.forEach((data) => {
            createMarker(data);
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
 * ^ 마커를 모두 삭제한다.
 */
function removeMarker() {
  markerList.forEach((obj) => {
    obj.marker.setMap(null);
  });
  markerList.length = 0;
}

/**
 * ^ 인포윈도우를 닫는다.
 */
function removeInfoWindow() {
  if (infoWindow) infoWindow.close();
}

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

// //* ========================================== 필터 관련 코드들 ================================================

// //* ========================================== 세권 관련 코드들 =================================================
// const resetBtn_hyperLocal = hyperLocal.querySelector(".filter__btn--reset");
// const applyBtn_hyperLocal = hyperLocal.querySelector(".filter__btn--apply");
// const chips = hyperLocal.querySelectorAll(".filter__option-chips");

// chips.forEach((chip) => {
//   chip.addEventListener("click", (e) => {
//     e.currentTarget.classList.toggle("active");
//   });
// });

// resetBtn_hyperLocal.addEventListener("click", (e) =>
//   chips.forEach((chip) => chip.classList.remove("active"))
// );

// applyBtn_hyperLocal.addEventListener("click", (e) => {
//   removeHyperLocalMarker();

//   let clickedCluster = kakaoMap.roomCluster._clusters.filter((cluster) =>
//     cluster.getClusterMarker().getContent().classList.contains("cluster-click")
//   )[0];

//   // 클러스터의 중심좌표
//   const lat = clickedCluster.getCenter().Ma;
//   const lng = clickedCluster.getCenter().La;

//   chips.forEach((chip) => {
//     if (chip.classList.contains("active")) {
//       // 검색할 키워드
//       const keyword = chip.dataset.keyword;
//       const markerImageName = chip.dataset.marker;

//       kakaoSearch
//         .search_hyperLocal(keyword, lat, lng)
//         .then((data) =>
//           data.forEach((item) => createHyperLocalMarker(item, markerImageName))
//         );
//     }
//   });
//   createRange(clickedCluster);
// });

// /**
//  * ^ 세권 버튼을 클릭 가능한 상태로 만드는 함수
//  */
// function ableHyperLocalBtn() {
//   hyperLocal.classList.remove("disable");
// }

// /**
//  * ^ 세권 버튼을 클릭 불가능한 상태로 만드는 함수
//  */
// function disableHyperLocalBtn() {
//   hyperLocal.classList.add("disable");
// }

/**
 * ^ 클러스터를 인자로 받아 클러스터를 기준으로 원(세권의 범위)을 생성한다.
 * @param {*} cluster 원을 생성할 클러스터
 */
function createRange(cluster) {
  let circle250 = new kakao.maps.Circle({
    center: cluster.getCenter(), // 원의 중심좌표 입니다
    radius: 250, // 미터 단위의 원의 반지름입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: "#75B8FA", // 선의 색깔입니다
    strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: "dashed", // 선의 스타일 입니다
    fillColor: "#CFE7FF", // 채우기 색깔입니다
    fillOpacity: 0.1, // 채우기 불투명도 입니다
  });
  let circle500 = new kakao.maps.Circle({
    center: cluster.getCenter(), // 원의 중심좌표 입니다
    radius: 500, // 미터 단위의 원의 반지름입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: "#75B8FA", // 선의 색깔입니다
    strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: "dashed", // 선의 스타일 입니다
    fillColor: "#CFE7FF", // 채우기 색깔입니다
    fillOpacity: 0.1, // 채우기 불투명도 입니다
  });
  let circle1000 = new kakao.maps.Circle({
    center: cluster.getCenter(), // 원의 중심좌표 입니다
    radius: 1000, // 미터 단위의 원의 반지름입니다
    strokeWeight: 2, // 선의 두께입니다
    strokeColor: "#75B8FA", // 선의 색깔입니다
    strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
    strokeStyle: "dashed", // 선의 스타일 입니다
    fillColor: "#CFE7FF", // 채우기 색깔입니다
    fillOpacity: 0.5, // 채우기 불투명도 입니다
  });

  if (circleList.length !== 0) {
    circleList.forEach((circle) => {
      circle.setMap(null);
    });
    circleList.length = 0;
  }

  circleList.push(circle1000);
  circleList.push(circle500);
  circleList.push(circle250);

  circleList.forEach((circle) => {
    circle.setMap(map);
  });
}

/**
 * 세권 마커를 생성한다.
 * @param {*} data 마커에 대한 정보
 * @param {*} markerImageName 마커의 이미지 이름
 */
function createHyperLocalMarker(data, markerImageName) {
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

  hyperLocalMarkerList.push(marekrObj);
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

kakao.maps.event.addListener(map, "click", function (mouseEvent) {
  console.log(map.getLevel());
  removeInfoWindow();
});

// 지도의 드래그가 끝났을때 화면에 보여지는 오버레이에 이벤트 등록
kakao.maps.event.addListener(map, "dragend", function () {
  kakaoMap.setEventOnOverlay();
});

// 지도 레벨에 따라 로컬, 지하철, 방을 보여준다.
// 보여지는 오버레이에 클릭이벤트를 등록한다.
kakao.maps.event.addListener(map, "zoom_changed", function (mouseEvent) {
  // 5이하 : 매물, 6~8 : 지하철, 9이상 : 로컬
  // 지하철 오버레이를 띄워야할때
  if (5 < map.getLevel() && map.getLevel() < 8) {
    kakaoMap.displayLocalOverlay(false);
    kakaoMap.displaySubwayOverlay(true);

    kakaoMap.displayRoomCluster(false);
    createRoomSection(null);
    filter.disableFilterBtn();
    kakaoMap.disableHyperLocalBtn();
    disableSortBtn();
  }
  // 매물 클러스터를 띄워야 할때
  else if (map.getLevel() <= 5) {
    console.log("매물이 보여야 한다.");
    // console.log("줌이 바뀌었는데 방정보 있을때");
    if (kakaoMap.getRoomClusterState()) {
      kakaoMap.displayRoomCluster(true);
      createRoomSection(null);
      kakaoMap.displayLocalOverlay(false);
      kakaoMap.displaySubwayOverlay(false);
      filter.ableFilterBtn();
    }
    // console.log("줌이 바뀌었는데 방정보 없을때");
    else {
      kakaoMap.displayLocalOverlay(false);
      kakaoMap.displaySubwayOverlay(true);
      filter.disableFilterBtn();
    }
  }
  // 로컬 오버레이를 띄워야할때
  else {
    console.log("지역이 보여야 한다.");
    kakaoMap.displayLocalOverlay(true);
    kakaoMap.displaySubwayOverlay(false);
    createRoomSection(null);
    filter.disableFilterBtn();
    kakaoMap.disableHyperLocalBtn();
    disableSortBtn();
  }

  kakaoMap.setEventOnOverlay();
});

/**
 * 지도를 해당 좌표로 부드럽게 이동시킨다.
 * @param {*} lat
 * @param {*} lng
 */
function panTo(lat, lng) {
  map.panTo(new kakao.maps.LatLng(lat, lng));
}

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

// * 리팩토링

init();
// export default { map, oneroom};
