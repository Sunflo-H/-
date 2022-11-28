import Oneroom from "./oneroomModule.js";
import KakaoSearch from "./kakaoSearchModule.js";

const filter = document.querySelectorAll(".filter__select");
const sortBtn = document.querySelectorAll(".sort-btn");
const layoutBtn = document.querySelectorAll(".layout-btn");

const search = document.querySelector(".search");
const searchInput = search.querySelector(".search__input");
const searchList = search.querySelector(".search-list");
const searchListItem = searchList.querySelectorAll(".search-list__item");
const nav = document.querySelector(".nav");
const navbox = document.querySelector(".nav__item-box");
const navItems = nav.querySelectorAll(".nav__item");

const searchIcon = search.querySelector(".search__label");

const CRITERIA_MAP_LEVEL = 7;
const oneroom = new Oneroom();
const kakaoSearch = new KakaoSearch();

/**
 * * id :
 * * name : 오버레이에 보여질 이름
 * * lat, lng : 좌표
 */
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
 * 생성된 클러스터 객체 : _clusters, _markers 등의 여러 정보를 가지고있다.
 */
let roomCluster = null;
/**
 * roomCluster 존재여부를 확인하는 변수,
 * roomCluster는 promise데이터로 만들기때문에 지연되는 시간차를 막고자 따로 만들었다.
 */
let roomClusterState = false;
/**
 * 클러스터를 생성할때 마커와 방정보를 함께 매핑한 배열
 */
let roomAndMarker = null;
/**
 * 현재 카드리스트에 사용되는 방 정보를 저장한 배열,
 */
let currentOneroomList = null;

/**
 * sort()하기 전 원본 배열
 */
let originalOneroomList = [];
/**
 * cardList의 현재 layout상태에 대한 변수
 */
let cardListLayout = "card";

let markerList = [];

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

//! 할것
//* 검색기능
//  1. 입력된 값으로 검색하기 +
//  2. 검색한 내용을 마커로 표시하기 +
//   2-1 마커를 꾸밀수 있나? 꾸밀수 있으면 마커로 +
//   2-2 꾸밀수 없다면 꾸밀수 있는 무언가로 + 오버레이로 합시다.
//   2-3 어떻게 꾸미는게 좋을까 +
//   2-4 마커 클릭하면 정보 띄우자 인포윈도우
//  3. 자동완성
//  4. 히스토리?
//  5. 지하철로 검색하면 그 장소로 바로 매물찾기? 매물없이 지하철만 찾고싶으면 어떡함,
//  6. 검색중 위 아래키 입력
//* 필터, 세권 만들기
//* 처음에 자기 위치 받아와서 바로 지하철로 보이게 만들기
//* 카드 클릭시 디테일 정보 보여주기
//* 각 페이지 별 기능 만들기
//* 로그인 기능
//* 카드 정렬 버튼 클릭했을때 스크롤이 제일 위로 가게

// 지도 생성
const map = new kakao.maps.Map(document.getElementById("map"), {
  center: new kakao.maps.LatLng(37.53886742395844, 126.98678427911392),
  level: 8,
  maxLevel: 12,
});

//* ============================== 방 정보, 방 클러스터 관련 코드들 =================================
/**
 *
 * ^ 역 주변 방정보를 요청하여 클러스터를 생성한다..
 */
async function createOneRoomCluster(subway) {
  loading(true);

  let oneroomList = await oneroom.getRoomData(subway); // 프로미스 배열이 있음, await 안쓰면 프로미스 안에 프로미스배열이 있음

  // oneroomList를 foreach 돌려서 async 안에 async의 흐름 확인해보기
  Promise.all(oneroomList).then((oneroomList) => {
    createCluster(oneroomList);
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
function createCardList(roomList = null) {
  const cardBox = document.querySelector(".card-box");
  const cards = cardBox.querySelector("ul.cards");

  while (cards.firstChild) {
    cards.removeChild(cards.firstChild);
  }

  // roomList가 없다면 기본값을 띄우고 함수 종료
  if (!roomList) {
    let element = `<li class="no-result">
                    <p class="no-result__text"><b>장소</b>를 클릭하여</p>
                    <p class="no-result__text">매물을 확인해보세요.</p>
                  </li>`;
    cards.insertAdjacentHTML("beforeend", element);
    return;
  }

  roomList.forEach((oneroom) => {
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
    let element = "";
    cardListLayout === "card"
      ? (element = `<li class="card">
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
                    </li>`)
      : (element = `<li class="card card--short">
                      <div class="card__text card__text--short">
                        <div class="card__price card__price--short">${type} ${price}</div>
                        <div class="card__size card__size--short">${size}</div>
                      </div>
                    </li>`);
    cards.insertAdjacentHTML("beforeend", element);
  });

  currentOneroomList = roomList;
  // 오리지널에 일치하는 값이 있다면 이미 오리지널이 존재하므로 바꾸지 않는다.
  // 오리지널에 일치하는 값이 없다면 아직 오리지널에 값을 저장하지 않은것이므로 roomList를 저장한다.
  if (!originalOneroomList.find((item) => item === roomList[0]))
    originalOneroomList = [...roomList];
}

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

  // 처음 생성된 클러스터에 적용하는 이벤트 (clustered 이벤트핸들러와 기능은 같다.)
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

    overlay.addEventListener("click", (e) => {
      roomCluster._clusters.forEach((cluster) => {
        cluster
          .getClusterMarker()
          .getContent()
          .classList.remove("cluster-click");
      });
      e.currentTarget.classList.add("cluster-click");
    });
  });

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

      overlay.addEventListener("click", (e) => {
        roomCluster._clusters.forEach((cluster) => {
          cluster
            .getClusterMarker()
            .getContent()
            .classList.remove("cluster-click");
        });
        e.currentTarget.classList.add("cluster-click");
      });
    }
  });

  kakao.maps.event.addListener(roomCluster, "clusterclick", function (cluster) {
    let roomList = cluster
      .getMarkers()
      .map(
        (marker) =>
          roomAndMarker.find((item) => marker === item.marker).roomData
      );

    createCardList(roomList);

    sortBtn.forEach((btn) => {
      const up = btn.querySelector(".fa-sort-up");
      const down = btn.querySelector(".fa-sort-down");
      btn.dataset.state = "basic";
      up.classList.add("active");
      down.classList.add("active");
    });
  });
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

/**
 * 카드리스트 정렬 버튼을 클릭했을때 사용되는 이벤트핸들러
 * @param {*} event
 * @param {*} sort1 버튼에 해당하는 정렬값
 * @param {*} sort2 버튼에 해당하는 정렬값
 * @returns
 */
function sortBtnClick(event, sort1, sort2) {
  if (!currentOneroomList) {
    alert("먼저 장소를 눌러 매물정보를 확인해주세요");
    return;
  }
  //* 정렬버튼 상태변화 및 정렬기능
  let btn = event.currentTarget;
  let state = btn.dataset.state;
  const up = btn.querySelector(".fa-sort-up");
  const down = btn.querySelector(".fa-sort-down");

  /**
   * 원래값을 바꾸지 않기위해 사용하는 변수
   */
  let sortOneroomList = [...currentOneroomList];
  if (state === "basic") state = "down";
  else if (state === "down") state = "up";
  else if (state === "up") state = "basic";

  switch (state) {
    case "basic":
      btn.dataset.state = "basic";
      up.classList.add("active");
      down.classList.add("active");
      createCardList(originalOneroomList);
      break;

    case "down": //오름차순
      btn.dataset.state = "down";
      up.classList.remove("active");
      down.classList.add("active");

      // 보증금을 누르면 월세는 항상 basic이 되게
      // 월세를 누르면 보증금은 항상 basic이 되게, 이 코드는 흐름상 down일때만 적용하면 된다.
      if (btn === sortBtn[0]) {
        sortBtn[1].dataset.state = "basic";
        sortBtn[1].querySelector(".fa-sort-up").classList.add("active");
        sortBtn[1].querySelector(".fa-sort-down").classList.add("active");
      } else {
        sortBtn[0].dataset.state = "basic";
        sortBtn[0].querySelector(".fa-sort-up").classList.add("active");
        sortBtn[0].querySelector(".fa-sort-down").classList.add("active");
      }

      btn === sortBtn[0]
        ? sortOneroomList.sort(
            (a, b) => Number(a.item[sort1]) - Number(b.item[sort1])
          )
        : sortOneroomList.sort(
            (a, b) => Number(a.item[sort2]) - Number(b.item[sort2])
          );

      createCardList(sortOneroomList);
      sortOneroomList = [...originalOneroomList];
      break;

    case "up": // 내림차순
      btn.dataset.state = "up";
      up.classList.add("active");
      down.classList.remove("active");
      btn === sortBtn[0]
        ? sortOneroomList.sort(
            (a, b) => Number(b.item[sort1]) - Number(a.item[sort1])
          )
        : sortOneroomList.sort(
            (a, b) => Number(b.item[sort2]) - Number(a.item[sort2])
          );

      createCardList(sortOneroomList);
      sortOneroomList = [...originalOneroomList];
      break;
  }
}

sortBtn.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    sortBtnClick(e, "보증금액", "월세금액");
    // 아파트 : 매매, 보증금액(전세)
    // 빌라 : 매매, 보증금액(전세)
    // 원룸 : 보증금액, 월세
    // 오피스텔 : 보증금액, 월세
  });
});

layoutBtn.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    if (!currentOneroomList) {
      alert("먼저 장소를 눌러 매물정보를 확인해주세요");
      return;
    }

    //이미 card레이아웃상태에서 또 card를 누르면 함수 종료
    if (cardListLayout === "card" && btn === layoutBtn[0]) return;
    if (cardListLayout === "short" && btn === layoutBtn[1]) return;

    if (btn === layoutBtn[0]) cardListLayout = "card";
    else cardListLayout = "short";

    layoutBtn[0].classList.remove("active");
    layoutBtn[1].classList.remove("active");
    btn.classList.add("active");

    createCardList(currentOneroomList);
  });
});

//* =============================== 지역 / 지하철 오버레이 관련 코드들 ===============================
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
    overlay.addEventListener("click", localOverlayClick);
  });
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
 *
 * @param {*} event
 */
function subwayOverlayClick(event) {
  let overlay = event.target;

  // 방 클러스터가 있음을 알리는 상태
  roomClusterState = true;

  // 이미 방에 대한 마커가 있다면 삭제, 삭제하지 않으면 계속 중첩된다.
  if (roomCluster) roomCluster.clear();

  // 방 정보를 요청하여 방클러스터 생성
  createOneRoomCluster(overlay.dataset.name);

  map.setLevel(5);
  map.setCenter(
    new kakao.maps.LatLng(overlay.dataset.lat, overlay.dataset.lng)
  );
}

/**
 * ^ 지역, 지하철 overlay들에게 클릭이벤트를 등록하는 함수
 */
function overlaySetEvent() {
  const localOverlay = document.querySelectorAll(
    ".customOverlay.customOverlay--local"
  );
  localOverlay.forEach((overlay) => {
    overlay.addEventListener("click", localOverlayClick);
  });

  // 지하철 오버레이는 많아서 모든 오버레이를 선택할수 있게 살짝 지연시켰다.
  setTimeout(() => {
    const subwayOverlay = document.querySelectorAll(
      ".customOverlay.customOverlay--subway"
    );

    subwayOverlay.forEach((overlay) => {
      overlay.addEventListener("click", subwayOverlayClick);
    });
  }, 500);
}

/**
 * ^ 로딩바가 보이게 하는 함수
 * @param {*} boolean ture:보인다, false:사라진다.
 */
function loading(boolean) {
  const loading = document.querySelector("#loading");
  if (boolean) loading.classList.add("active");
  else loading.classList.remove("active");
}

/**
 * ^ 평수를 구하는 함수
 * @param {*} size 전용면적
 * @returns 평수
 */
function getPyeong(size) {
  return Math.floor(Math.round(Number(size)) / 3);
}

/**
 * 지역 오버레이와 지하철 오버레이를 보이게 할지 안보이게 할지 정하는 함수
 * * map : 지도에 보이게한다.
 * * null : 안보이게 한다.
 * @param {*} localState map, null
 * @param {*} subwayState map, null
 */
function displayOverlay_local_subway(localState, subwayState) {
  localOverlayList.forEach((localOverlay) => localOverlay.setMap(localState));
  subwayOverlayList.forEach((subwayOverlay) =>
    subwayOverlay.setMap(subwayState)
  );
}

//* ============================================== 검색 기능 ========================================================

function enterKey() {
  //* 엔터키입력
  //! 1. search-list에 active 제거
  //! 2. search에 active 제거
  //! 3. 검색한 결과를 맵에 보이게 하기
  const lat = map.getCenter().Ma;
  const lng = map.getCenter().La;
  if (!searchInput.value) return;
  kakaoSearch.search(searchInput.value, lat, lng).then((data) => {
    const addressSearchData = data[0];
    const keywordSearchData = data[1];
    console.log(data);

    // 주소검색 결과가 있다면 주소검색 결과만 다룬다.
    if (addressSearchData.length !== 0) {
      panTo(addressSearchData[0].y, addressSearchData[0].x);
      removeMarker();
      addressSearchData.forEach((data) => {
        createMarker(data);
      });
      // setMarkerEvent();
      // return data;
    }
    // 키워드검색 결과만 있다면 키워드검색 결과만 다룬다.
    else if (addressSearchData.length === 0 && keywordSearchData.length !== 0) {
      panTo(keywordSearchData[0].y, keywordSearchData[0].x);
      removeMarker();
      keywordSearchData.forEach((data) => {
        createMarker(data);
      });
      // setMarkerEvent();
    }
    // 주소데이터, 키워드데이터 둘다 없다면
    else if (addressSearchData.length === 0 && keywordSearchData.length === 0) {
      alert("검색 결과가 없습니다.");
    }
  });
  displaySearchList(false);
}

function displaySearchList(isTrue) {
  const searchList = document.querySelector(".search-list");

  if (isTrue) {
    searchList.classList.add("active");
    // searchListState.setState(true);
  } else {
    searchList.classList.remove("active");
    // searchListState.setState(false);
  }
}

/** 검색창에 위, 아래, 엔터 각각의 함수를 이벤트로 등록한다. */
searchInput.addEventListener("keyup", (e) => {
  if (e.keyCode === 13) enterKey();
  else if (e.keyCode === 38) {
    if (searchListState.getState()) upKey();
  } else if (e.keyCode === 40) {
    if (searchListState.getState()) downKey();
  } else if (e.isComposing === false) return; //엔터키 중복입력을 막는다.
});

/**
 * 장소 data를 받아 1개의 마커를 생성하는 함수
 * @param {*} data
 */
function createMarker(data) {
  let address = data.address_name.replaceAll(" ", "&");
  let roadAddress = data.road_address_name || null;
  let place = data.place_name || null;
  let category = data.category_group_name; //주소, 장소, 음식점-카페 등등
  let lat = data.y;
  let lng = data.x;

  if (roadAddress) roadAddress = roadAddress.replaceAll(" ", "&");
  if (place) place = place.replaceAll(" ", "&");

  let content = `
  <div class="marker" 
    data-place =${place} 
    data-address= ${address} 
    data-road-address= ${roadAddress} 
    data-category = ${category}
    data-data-lat =${lat} 
    data-lng = ${lng} >
    <i class="fa-solid fa-location-dot"></i>
  </div>`;

  let customOverlay = new kakao.maps.CustomOverlay({
    map: map,
    clickable: true,
    content: content,
    position: new kakao.maps.LatLng(lat, lng),
    yAnchor: 1,
    zIndex: 3,
  });

  customOverlay.a.addEventListener("click", (e) => {
    let marker = e.currentTarget.firstElementChild;
    console.log(marker);
  });

  let marekrObj = {
    marker: customOverlay,
    info: data,
  };

  markerList.push(marekrObj);
}

/**
 * 마커를 모두 삭제한다.
 */
function removeMarker() {
  markerList.forEach((obj) => {
    obj.marker.setMap(null);
  });
  markerList = [];
}

// 검색창을 클릭하면 움직이게 하고, input에 포커스를 준다.
search.addEventListener("click", (e) => {
  search.classList.add("active");
  searchInput.focus();
  // if (searchInput.value !== "") searchList.classList.add("active");
});

// searchInput.addEventListener("keyup", (e) => {
//   searchList.classList.add("active");
// });

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
  console.log(roomCluster);
});

// ! 오버레이에 이벤트를 등록해야하는 상황
// !1.에서 처음부터 생성.. 사용자 위치를 기준으로 지도레벨 확대해서 지하철부터 보여줄까???????
// 1. 새 오버레이 생성 (로컬의 경우 처음부터 생성되었기때문에 이때 적용함, subway랑 매물은 아님)
// 2. 지도확대 축소후 새로 생긴 오버레이
// 3. 지도 이동후 새로생긴 오버레이

// 지도의 드래그가 끝났을때 화면에 보여지는 오버레이에 이벤트 등록
kakao.maps.event.addListener(map, "dragend", function () {
  overlaySetEvent();
});

/**
 * 지도 레벨에 따라 지역, 지하철, 방을 보여준다.
 * 보여지는 오버레이에 클릭이벤트를 등록한다.
 */
kakao.maps.event.addListener(map, "zoom_changed", function (mouseEvent) {
  // 5이하 : 매물, 6~8 : 지하철, 9이상 : 지역
  if (5 < map.getLevel() && map.getLevel() < 8) {
    // console.log("지하철 오버레이를 띄워야할때");
    displayOverlay_local_subway(null, map);

    displayRoomCluster(false);
    createCardList();
  } else if (map.getLevel() <= 5) {
    if (roomClusterState) {
      // console.log("줌이 바뀌었는데 방정보 있을때");
      displayRoomCluster(true);
      createCardList();
      displayOverlay_local_subway(null, null);
    } else {
      // console.log("줌이 바뀌었는데 방정보 없을때");
      displayOverlay_local_subway(null, map);
    }
  } else {
    // console.log("로컬 오버레이를 띄워야할때");
    displayOverlay_local_subway(map, null);

    createCardList();
  }

  overlaySetEvent();
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
  createOverlay_subway();
  createOverlay_local(local);
  createCardList();
}

init();
